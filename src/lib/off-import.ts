import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { searchPeruvianProducts } from "./openfoodfacts";
import { evaluateProduct } from "./sumi-score";
import type { Nutriments, Product } from "./types";

/**
 * Importador masivo de productos peruanos desde Open Food Facts (OFF).
 *
 * Es la "Leg A" de la estrategia de datos: OFF es la unica fuente abierta que
 * trae nutricion + ingredientes + imagenes + EAN bajo licencia libre (ODbL).
 * Este modulo recorre el catalogo de OFF filtrado a Peru, calcula el Sumi-Score
 * y los octogonos con el mismo motor de la app, y hace upsert idempotente en la
 * tabla `products` de Supabase (PK = barcode, asi que re-ejecutar no duplica).
 *
 * Se invoca desde:
 *  - el cron de Vercel (`/api/cron/import-off`), para mantenimiento periodico, y
 *  - el script `scripts/import-off.ts`, para una corrida manual local.
 *
 * Nota: la red de OFF debe ser alcanzable desde donde se ejecute. El entorno de
 * desarrollo de Claude Code tiene la red restringida; corre en Vercel o local.
 */

/**
 * Cliente con permisos de escritura. Prefiere la service-role key (lo correcto
 * para un job server-side), y cae a la anon/publishable si no esta — la tabla
 * `products` tiene policy publica de insert/update, asi que ambas funcionan.
 */
function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** true si hay al menos un nutriente con el que valga la pena puntuar. */
export function hasNutrition(n: Nutriments): boolean {
  return (
    n.energyKcal != null ||
    n.sugars != null ||
    n.saturatedFat != null ||
    n.sodium != null ||
    n.proteins != null
  );
}

/** true si el producto trae algo aprovechable (nombre real, nutricion o foto). */
export function isWorthStoring(p: Product): boolean {
  const hasName = p.name.trim().length > 0 && p.name !== "Producto sin nombre";
  return hasName || hasNutrition(p.nutriments) || Boolean(p.imageUrl);
}

interface ProductRow {
  barcode: string;
  name: string;
  brand: string | null;
  kind: Product["kind"];
  is_beverage: boolean;
  nutriments: Nutriments;
  nova_group: number | null;
  additives: string[];
  image_url: string | null;
  source: Product["source"];
  score: number | null;
  level: string | null;
  octogonos: unknown;
  updated_at: string;
}

/**
 * Construye la fila de Supabase para un producto. Solo puntua si es
 * alimento/bebida CON datos nutricionales; si no, deja score/level/octogonos
 * vacios (queda "pendiente de datos" en vez de mostrar una nota inventada).
 */
export function toProductRow(p: Product): ProductRow {
  const scorable = p.kind !== "cosmetic" && hasNutrition(p.nutriments);
  const e = scorable ? evaluateProduct(p) : null;
  return {
    barcode: p.barcode,
    name: p.name,
    brand: p.brand ?? null,
    kind: p.kind,
    is_beverage: p.isBeverage,
    nutriments: p.nutriments,
    nova_group: p.novaGroup ?? null,
    additives: p.additives,
    image_url: p.imageUrl ?? null,
    source: p.source,
    score: e?.score ?? null,
    level: e?.level ?? null,
    octogonos: e?.octogonos ?? [],
    updated_at: new Date().toISOString(),
  };
}

export interface ImportOptions {
  /** Pagina inicial del buscador de OFF (1-indexed). */
  startPage?: number;
  /** Cuantas paginas traer como maximo en esta corrida. */
  maxPages?: number;
  /** Productos por pagina (OFF limita a 100). */
  pageSize?: number;
  /** Pausa entre paginas para ser amable con OFF (ms). */
  delayMs?: number;
  /** Filas por lote de upsert. */
  batchSize?: number;
  onProgress?: (msg: string) => void;
}

export interface ImportSummary {
  scanned: number;
  upserted: number;
  skipped: number;
  pagesFetched: number;
  /** Paginas que fallaron (tras reintentos) y se saltaron. */
  failedPages: number;
  lastPage: number;
  totalCount: number;
  /** Ultimo error encontrado, si lo hubo (la corrida igual continua/termina). */
  lastError?: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Recorre OFF (Peru) y hace upsert de los productos en Supabase.
 * Idempotente: re-ejecutar actualiza, no duplica (PK = barcode).
 */
export async function importPeruvianProducts(
  opts: ImportOptions = {},
): Promise<ImportSummary> {
  const startPage = Math.max(1, opts.startPage ?? 1);
  const maxPages = Math.max(1, opts.maxPages ?? 10);
  const pageSize = Math.min(opts.pageSize ?? 100, 100);
  const delayMs = opts.delayMs ?? 500;
  const batchSize = opts.batchSize ?? 100;
  const log = opts.onProgress ?? (() => {});

  const supabase = adminClient();
  if (!supabase) {
    throw new Error(
      "Supabase no configurado: define NEXT_PUBLIC_SUPABASE_URL y una key.",
    );
  }

  const summary: ImportSummary = {
    scanned: 0,
    upserted: 0,
    skipped: 0,
    pagesFetched: 0,
    failedPages: 0,
    lastPage: startPage - 1,
    totalCount: 0,
  };

  // Corta la corrida si OFF falla varias paginas seguidas (probable caida).
  const MAX_CONSECUTIVE_FAILURES = 3;
  let consecutiveFailures = 0;

  // Recorremos como maximo `maxPages` paginas (exitos + fallos cuentan), asi
  // un goteo de errores intermitentes no puede alargar la corrida sin limite.
  for (let i = 0; i < maxPages; i++) {
    const page = startPage + i;
    log(`Trayendo pagina ${page} de OFF (Peru)...`);

    let res;
    try {
      res = await searchPeruvianProducts({ page, pageSize });
      consecutiveFailures = 0;
    } catch (err) {
      summary.failedPages++;
      summary.lastError = err instanceof Error ? err.message : String(err);
      consecutiveFailures++;
      log(`Pagina ${page} fallo: ${summary.lastError} (se salta).`);
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        log("Demasiados fallos seguidos: corto la corrida.");
        break;
      }
      await delay(delayMs);
      continue;
    }

    summary.totalCount = res.count;
    summary.pagesFetched++;
    summary.lastPage = page;

    if (res.products.length === 0) {
      log("Pagina vacia: fin del catalogo.");
      break;
    }

    const rows: ProductRow[] = [];
    for (const p of res.products) {
      summary.scanned++;
      if (!isWorthStoring(p)) {
        summary.skipped++;
        continue;
      }
      rows.push(toProductRow(p));
    }

    for (let j = 0; j < rows.length; j += batchSize) {
      const chunk = rows.slice(j, j + batchSize);
      const { error } = await supabase
        .from("products")
        .upsert(chunk, { onConflict: "barcode" });
      if (error) {
        throw new Error(`Upsert fallo en pagina ${page}: ${error.message}`);
      }
      summary.upserted += chunk.length;
    }
    log(
      `Pagina ${page}: ${rows.length} guardados, ${
        res.products.length - rows.length
      } omitidos (acumulado: ${summary.upserted}).`,
    );

    const totalPages = Math.ceil(res.count / pageSize);
    if (page >= totalPages) {
      log(`Ultima pagina alcanzada (${totalPages} en total).`);
      break;
    }
    await delay(delayMs);
  }

  return summary;
}
