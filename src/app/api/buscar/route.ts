import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/supabase";

/** GET /api/buscar?q=quinua — busca productos por nombre en la base de Sumi. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const results = await searchProducts(q);
  return NextResponse.json({ results });
}
