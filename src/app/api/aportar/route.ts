import { NextResponse } from "next/server";
import { aiEnabled, extractFromPhoto } from "@/lib/extract";
import { evaluateProduct } from "@/lib/sumi-score";
import { cacheProduct, saveContribution } from "@/lib/supabase";
import type { Product } from "@/lib/types";

export const maxDuration = 60; // la vision puede tardar unos segundos

/**
 * POST /api/aportar
 * body: { barcode, image (data URL base64) }
 *
 * Flujo colaborativo V1: el usuario fotografia la etiqueta de un producto que
 * no estaba en la base; la IA lo lee, Sumi lo evalua y lo guarda para todos.
 */
export async function POST(req: Request) {
  if (!aiEnabled()) {
    return NextResponse.json(
      { error: "La lectura por IA aun no esta configurada (falta ANTHROPIC_API_KEY)." },
      { status: 503 },
    );
  }

  let body: { barcode?: string; image?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const { barcode, image } = body;
  if (!barcode || !/^\d{8,14}$/.test(barcode)) {
    return NextResponse.json({ error: "Codigo de barras invalido." }, { status: 400 });
  }
  if (!image) {
    return NextResponse.json({ error: "Falta la imagen." }, { status: 400 });
  }

  // data:image/jpeg;base64,XXXX -> tipo + datos
  const match = image.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
  if (!match) {
    return NextResponse.json(
      { error: "Formato de imagen no soportado (usa JPEG, PNG o WebP)." },
      { status: 400 },
    );
  }
  const mediaType = match[1] as "image/jpeg" | "image/png" | "image/webp";
  const data = match[3];

  try {
    const extracted = await extractFromPhoto(data, mediaType);
    if (!extracted.readable || !extracted.product) {
      return NextResponse.json({
        readable: false,
        message: "No pudimos leer la etiqueta. Intenta con mejor luz y enfoque.",
      });
    }

    const product: Product = {
      ...extracted.product,
      barcode,
      source: "user-photo",
    };
    const evaluation = evaluateProduct(product);

    await Promise.allSettled([
      cacheProduct(product, evaluation),
      saveContribution(barcode, extracted.product),
    ]);

    return NextResponse.json({ readable: true, product, evaluation, from: "user-photo" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error procesando la imagen." },
      { status: 502 },
    );
  }
}
