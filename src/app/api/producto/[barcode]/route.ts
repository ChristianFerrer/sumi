import { NextResponse } from "next/server";
import { fetchFromOpenFoodFacts } from "@/lib/openfoodfacts";
import { evaluateProduct } from "@/lib/sumi-score";

/**
 * GET /api/producto/:barcode
 *
 * Flujo de datos de Sumi:
 *  1. (V1) buscar en la base propia de Supabase  -> pendiente
 *  2. buscar en Open Food Facts                  -> aqui
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
    const product = await fetchFromOpenFoodFacts(barcode);
    if (!product) {
      return NextResponse.json({ found: false, barcode });
    }
    const evaluation = evaluateProduct(product);
    return NextResponse.json({ found: true, product, evaluation });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 502 },
    );
  }
}
