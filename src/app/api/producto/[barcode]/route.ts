import { NextResponse } from "next/server";
import { fetchFromOpenFoodFacts } from "@/lib/openfoodfacts";
import { evaluateProduct } from "@/lib/sumi-score";
import { cacheProduct, getCachedProduct } from "@/lib/supabase";

/**
 * GET /api/producto/:barcode
 *
 * Flujo de datos de Sumi (en capas):
 *  1. buscar en la base propia (Supabase) ........... cache rapida
 *  2. buscar en Open Food Facts ..................... primera fuente externa
 *  3. si no existe: { found: false } y la app abre el flujo foto + IA
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ barcode: string }> },
) {
  const { barcode } = await params;

  if (!/^\d{8,14}$/.test(barcode)) {
    return NextResponse.json(
      { error: "Codigo de barras invalido." },
      { status: 400 },
    );
  }

  try {
    // 1. Cache propia
    const cached = await getCachedProduct(barcode);
    if (cached) {
      return NextResponse.json({
        found: true,
        product: cached,
        evaluation: evaluateProduct(cached),
        from: "sumi-db",
      });
    }

    // 2. Open Food Facts
    const product = await fetchFromOpenFoodFacts(barcode);
    if (!product) {
      return NextResponse.json({ found: false, barcode });
    }

    const evaluation = evaluateProduct(product);
    // 3. Poblar la cache para la proxima (no bloquea la respuesta si falla)
    await cacheProduct(product, evaluation).catch(() => {});

    return NextResponse.json({ found: true, product, evaluation, from: "openfoodfacts" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 502 },
    );
  }
}
