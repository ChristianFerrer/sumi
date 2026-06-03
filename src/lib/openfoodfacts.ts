import type { Nutriments, Product, ProductKind } from "./types";

/**
 * Cliente de Open Food Facts (OFF).
 *
 * OFF es la base abierta y colaborativa que usamos como primera fuente de datos.
 * IMPORTANTE: OFF exige un header User-Agent que identifique la app, o responde
 * 403. Se configura via la variable de entorno OFF_USER_AGENT.
 *
 * Prefijo EAN-13 de productos peruanos (GS1 Peru): 775.
 */

const OFF_BASE = "https://world.openfoodfacts.org/api/v2";
const FIELDS = [
  "code",
  "product_name",
  "brands",
  "nutriments",
  "nova_group",
  "additives_tags",
  "image_front_url",
  "categories_tags",
].join(",");

export const PERU_EAN_PREFIX = "775";

export function isPeruvianBarcode(barcode: string): boolean {
  return barcode.startsWith(PERU_EAN_PREFIX);
}

function offUserAgent(): string {
  return process.env.OFF_USER_AGENT || "Sumi/0.1 (contacto@sumi.pe)";
}

interface OffResponse {
  status: number;
  product?: Record<string, unknown>;
}

function num(value: unknown): number | undefined {
  const n = typeof value === "string" ? parseFloat(value) : (value as number);
  return Number.isFinite(n) ? n : undefined;
}

/** g de sodio en OFF -> mg que usan nuestros umbrales. */
function sodiumMg(nutr: Record<string, unknown>): number | undefined {
  const sodiumG = num(nutr["sodium_100g"]);
  if (sodiumG != null) return sodiumG * 1000;
  const saltG = num(nutr["salt_100g"]);
  if (saltG != null) return (saltG / 2.5) * 1000; // sal -> sodio
  return undefined;
}

function detectKind(categories: string[], isBeverage: boolean): ProductKind {
  if (categories.some((c) => c.includes("cosmetic") || c.includes("beauty"))) {
    return "cosmetic";
  }
  return isBeverage ? "beverage" : "food";
}

/**
 * Convierte el JSON crudo de OFF al modelo normalizado de Sumi.
 * Exportado para reusarlo tanto en la consulta por codigo como en la
 * importacion masiva (off-import.ts).
 */
export function normalizeOffProduct(
  barcode: string,
  raw: Record<string, unknown>,
): Product {
  const nutr = (raw["nutriments"] as Record<string, unknown>) ?? {};
  const categories = (raw["categories_tags"] as string[]) ?? [];
  const isBeverage = categories.some((c) => c.includes("beverage") || c.includes("drink"));

  const nutriments: Nutriments = {
    energyKcal: num(nutr["energy-kcal_100g"]),
    sugars: num(nutr["sugars_100g"]),
    saturatedFat: num(nutr["saturated-fat_100g"]),
    transFat: num(nutr["trans-fat_100g"]),
    sodium: sodiumMg(nutr),
    fiber: num(nutr["fiber_100g"]),
    proteins: num(nutr["proteins_100g"]),
    fruitsVegetablesNuts: num(nutr["fruits-vegetables-nuts-estimate-from-ingredients_100g"]),
  };

  const additives = ((raw["additives_tags"] as string[]) ?? []).map((t) =>
    t.replace(/^en:/, ""),
  );

  const nova = num(raw["nova_group"]);

  return {
    barcode,
    name: (raw["product_name"] as string) || "Producto sin nombre",
    brand: (raw["brands"] as string) || undefined,
    kind: detectKind(categories, isBeverage),
    isBeverage,
    nutriments,
    novaGroup: nova && nova >= 1 && nova <= 4 ? (nova as 1 | 2 | 3 | 4) : undefined,
    additives,
    imageUrl: (raw["image_front_url"] as string) || undefined,
    source: "openfoodfacts",
  };
}

/**
 * Busca un producto por codigo de barras en Open Food Facts.
 * Devuelve null si no existe (status 0) — ese caso dispara el flujo
 * colaborativo (foto + IA) en la app.
 */
export async function fetchFromOpenFoodFacts(
  barcode: string,
): Promise<Product | null> {
  const res = await fetch(
    `${OFF_BASE}/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`,
    { headers: { "User-Agent": offUserAgent() }, next: { revalidate: 60 * 60 } },
  );

  if (!res.ok) {
    throw new Error(`Open Food Facts respondio ${res.status}`);
  }

  const data = (await res.json()) as OffResponse;
  if (data.status !== 1 || !data.product) return null;

  return normalizeOffProduct(barcode, data.product);
}

interface OffSearchResponse {
  count?: number;
  page?: number;
  page_size?: number;
  products?: Record<string, unknown>[];
}

export interface OffSearchPage {
  /** Productos peruanos de esta pagina, ya normalizados. */
  products: Product[];
  /** Total de productos que coinciden con el filtro (todas las paginas). */
  count: number;
  page: number;
  pageSize: number;
}

/**
 * Trae una pagina de productos vendidos en Peru desde el buscador de OFF.
 *
 * Usa el filtro por pais (`countries_tags_en=peru`), que es la forma limpia y
 * abierta de acotar el catalogo a lo relevante para Sumi. Ordena por escaneos
 * para priorizar los productos mas reales/populares primero.
 */
export async function searchPeruvianProducts(opts: {
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}): Promise<OffSearchPage> {
  const page = opts.page ?? 1;
  const pageSize = Math.min(opts.pageSize ?? 100, 100);

  const url = new URL(`${OFF_BASE}/search`);
  url.searchParams.set("countries_tags_en", "peru");
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("sort_by", "unique_scans_n");
  url.searchParams.set("page", String(page));
  url.searchParams.set("page_size", String(pageSize));

  const res = await fetch(url, {
    headers: { "User-Agent": offUserAgent() },
    signal: opts.signal,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Open Food Facts (search) respondio ${res.status}`);
  }

  const data = (await res.json()) as OffSearchResponse;
  const raws = data.products ?? [];
  const products: Product[] = [];
  for (const raw of raws) {
    const code = typeof raw["code"] === "string" ? (raw["code"] as string) : "";
    if (!code) continue;
    products.push(normalizeOffProduct(code, raw));
  }

  return {
    products,
    count: data.count ?? products.length,
    page: data.page ?? page,
    pageSize: data.page_size ?? pageSize,
  };
}
