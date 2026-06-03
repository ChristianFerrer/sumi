/**
 * Importacion manual de productos peruanos desde Open Food Facts a Supabase.
 *
 * Uso (desde una maquina con acceso a la red de OFF):
 *   npm run import:off            # trae 100 paginas (~10k productos)
 *   PAGES=20 npm run import:off   # limita la corrida
 *   START=21 npm run import:off   # continua desde la pagina 21
 *
 * Lee las credenciales de .env.local (NEXT_PUBLIC_SUPABASE_URL + una key, y
 * opcionalmente SUPABASE_SERVICE_ROLE_KEY y OFF_USER_AGENT).
 */
import { readFileSync } from "node:fs";

// Carga .env.local sin depender de dotenv (vite-node no lo hace solo).
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
} catch {
  // sin .env.local: se asume que las variables ya estan en el entorno.
}

import { importPeruvianProducts } from "../src/lib/off-import";

async function main() {
  const maxPages = parseInt(process.env.PAGES ?? "100", 10);
  const startPage = parseInt(process.env.START ?? "1", 10);

  console.log(`Iniciando importacion OFF (Peru): ${maxPages} pagina(s) desde la ${startPage}.`);
  const summary = await importPeruvianProducts({
    maxPages,
    startPage,
    onProgress: (msg) => console.log(`  ${msg}`),
  });

  console.log("\nResumen:");
  console.log(`  Escaneados : ${summary.scanned}`);
  console.log(`  Guardados  : ${summary.upserted}`);
  console.log(`  Omitidos   : ${summary.skipped}`);
  console.log(`  Paginas    : ${summary.pagesFetched} (ultima: ${summary.lastPage})`);
  console.log(`  Total OFF  : ${summary.totalCount}`);
}

main().catch((err) => {
  console.error("Importacion fallo:", err);
  process.exit(1);
});
