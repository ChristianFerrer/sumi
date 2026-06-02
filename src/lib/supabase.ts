import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Octogono, Product, ProductKind, SumiEvaluation } from "./types";

/**
 * Cliente de Supabase y capa de cache de productos (Fase V1).
 *
 * Supabase es la base propia de Sumi: cache de lo que viene de Open Food Facts
 * y deposito de los aportes de la comunidad (flujo foto + IA). Con el tiempo,
 * la mejor base de productos peruanos del pais.
 *
 * Si las variables de entorno no estan configuradas, toda la capa degrada con
 * elegancia (devuelve null / no escribe) y la app sigue funcionando solo con OFF.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;
if (url && key) {
  client = createClient(url, key, { auth: { persistSession: false } });
}

export function supabaseEnabled(): boolean {
  return client !== null;
}

interface ProductRow {
  barcode: string;
  name: string;
  brand: string | null;
  kind: ProductKind;
  is_beverage: boolean;
  category: string | null;
  nutriments: Product["nutriments"];
  nova_group: number | null;
  additives: string[];
  image_url: string | null;
  source: Product["source"];
  score: number | null;
  level: SumiEvaluation["level"] | null;
  octogonos: Octogono[];
}

function rowToProduct(row: ProductRow): Product {
  return {
    barcode: row.barcode,
    name: row.name,
    brand: row.brand ?? undefined,
    kind: row.kind,
    isBeverage: row.is_beverage,
    nutriments: row.nutriments ?? {},
    novaGroup:
      row.nova_group && row.nova_group >= 1 && row.nova_group <= 4
        ? (row.nova_group as 1 | 2 | 3 | 4)
        : undefined,
    additives: row.additives ?? [],
    imageUrl: row.image_url ?? undefined,
    source: row.source,
  };
}

/** Lee un producto de la cache propia. null si no esta o si Supabase no esta configurado. */
export async function getCachedProduct(barcode: string): Promise<Product | null> {
  if (!client) return null;
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("barcode", barcode)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProduct(data as ProductRow);
}

/** Guarda/actualiza un producto y su evaluacion en la cache. No lanza si falla. */
export async function cacheProduct(
  product: Product,
  evaluation: SumiEvaluation,
): Promise<void> {
  if (!client) return;
  await client.from("products").upsert(
    {
      barcode: product.barcode,
      name: product.name,
      brand: product.brand ?? null,
      kind: product.kind,
      is_beverage: product.isBeverage,
      nutriments: product.nutriments,
      nova_group: product.novaGroup ?? null,
      additives: product.additives,
      image_url: product.imageUrl ?? null,
      source: product.source,
      score: evaluation.score,
      level: evaluation.level,
      octogonos: evaluation.octogonos,
    },
    { onConflict: "barcode" },
  );
}

/** Registra un aporte de la comunidad (auditoria del flujo foto + IA). */
export async function saveContribution(
  barcode: string,
  extracted: unknown,
): Promise<void> {
  if (!client) return;
  await client
    .from("contributions")
    .insert({ barcode, extracted, status: "processed" });
}
