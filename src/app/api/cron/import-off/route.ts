import { NextResponse } from "next/server";
import { importPeruvianProducts } from "@/lib/off-import";

/**
 * GET /api/cron/import-off — importa productos peruanos desde Open Food Facts
 * a la base de Sumi. Lo dispara el cron de Vercel (ver vercel.json) y tambien
 * puede invocarse a mano para traer mas paginas.
 *
 * Seguridad: si CRON_SECRET esta definido, exige `Authorization: Bearer <secret>`
 * (que Vercel Cron envia automaticamente) o `?secret=<secret>` para pruebas.
 *
 * Parametros opcionales:
 *   ?pages=10   cuantas paginas traer en esta corrida (1-100)
 *   ?start=1    pagina inicial (para continuar una importacion grande)
 *   ?size=100   productos por pagina (1-100)
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function clampInt(
  raw: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = raw == null ? NaN : parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // sin secret configurado: util en local/dev
  const auth = req.headers.get("authorization");
  const fromQuery = new URL(req.url).searchParams.get("secret");
  return auth === `Bearer ${secret}` || fromQuery === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const maxPages = clampInt(url.searchParams.get("pages"), 10, 1, 100);
  const startPage = clampInt(url.searchParams.get("start"), 1, 1, 100000);
  const pageSize = clampInt(url.searchParams.get("size"), 100, 1, 100);

  try {
    const summary = await importPeruvianProducts({ maxPages, startPage, pageSize });
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
