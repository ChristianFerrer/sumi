import { NextResponse } from "next/server";
import { findBetterAlternative } from "@/lib/supabase";
import type { Product } from "@/lib/types";

/**
 * GET /api/alternativas?kind=food&exclude=BARCODE&minScore=41
 * Devuelve un producto mejor del mismo tipo, o { alternative: null }.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = (url.searchParams.get("kind") ?? "food") as Product["kind"];
  const exclude = url.searchParams.get("exclude") ?? "";
  const minScore = Number(url.searchParams.get("minScore") ?? "0");

  const alternative = await findBetterAlternative(kind, exclude, minScore);
  return NextResponse.json({ alternative });
}
