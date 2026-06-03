"use client";

import type { GradeLevel, Product, SumiEvaluation } from "./types";
import { getSupabaseBrowser } from "./supabaseBrowser";

/**
 * Historial de productos escaneados.
 *
 * - localStorage es la fuente instantánea para la UI (funciona sin sesión y offline).
 * - Cuando hay sesión, se sincroniza con la tabla `scans` de Supabase para que
 *   el historial siga al usuario en todos sus dispositivos (merge bidireccional).
 */

const KEY = "sumi:historial";
const MAX = 200;

export interface HistoryEntry {
  barcode: string;
  name: string;
  brand?: string;
  kind: Product["kind"];
  imageUrl?: string;
  score: number | null;
  level: GradeLevel | null;
  scannedAt: number;
}

// ---------------------------------------------------------------------------
// localStorage (fuente para la UI)
// ---------------------------------------------------------------------------

function read(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  window.dispatchEvent(new Event("sumi:historial-cambio"));
}

export function getHistory(): HistoryEntry[] {
  return read();
}

// ---------------------------------------------------------------------------
// Sincronización con Supabase
// ---------------------------------------------------------------------------

let currentUserId: string | null = null;

function entryToRow(e: HistoryEntry) {
  return {
    user_id: currentUserId,
    barcode: e.barcode,
    name: e.name,
    brand: e.brand ?? null,
    kind: e.kind,
    image_url: e.imageUrl ?? null,
    score: e.score,
    level: e.level,
    scanned_at: new Date(e.scannedAt).toISOString(),
  };
}

interface ScanRow {
  barcode: string;
  name: string;
  brand: string | null;
  kind: Product["kind"];
  image_url: string | null;
  score: number | null;
  level: GradeLevel | null;
  scanned_at: string;
}

function rowToEntry(r: ScanRow): HistoryEntry {
  return {
    barcode: r.barcode,
    name: r.name,
    brand: r.brand ?? undefined,
    kind: r.kind,
    imageUrl: r.image_url ?? undefined,
    score: r.score,
    level: r.level,
    scannedAt: new Date(r.scanned_at).getTime(),
  };
}

async function pushScan(e: HistoryEntry) {
  if (!currentUserId) return;
  const sb = getSupabaseBrowser();
  await sb?.from("scans").upsert(entryToRow(e), { onConflict: "user_id,barcode" });
}

async function pushDelete(barcode: string) {
  if (!currentUserId) return;
  const sb = getSupabaseBrowser();
  await sb?.from("scans").delete().eq("user_id", currentUserId).eq("barcode", barcode);
}

async function pushClear() {
  if (!currentUserId) return;
  const sb = getSupabaseBrowser();
  await sb?.from("scans").delete().eq("user_id", currentUserId);
}

/**
 * Une el historial local con el remoto: por cada producto gana el escaneo más
 * reciente. Luego deja el resultado en local y empuja al remoto lo que falte.
 */
async function syncFromRemote() {
  if (!currentUserId) return;
  const sb = getSupabaseBrowser();
  if (!sb) return;

  const { data, error } = await sb
    .from("scans")
    .select("barcode,name,brand,kind,image_url,score,level,scanned_at")
    .eq("user_id", currentUserId);
  if (error) return;

  const remote = (data as ScanRow[]).map(rowToEntry);
  const remoteMap = new Map(remote.map((e) => [e.barcode, e]));

  const merged = new Map<string, HistoryEntry>(remoteMap);
  const toPush: HistoryEntry[] = [];
  for (const local of read()) {
    const r = remoteMap.get(local.barcode);
    if (!r || local.scannedAt > r.scannedAt) {
      merged.set(local.barcode, local);
      toPush.push(local);
    }
  }

  const sorted = [...merged.values()].sort((a, b) => b.scannedAt - a.scannedAt);
  write(sorted);

  if (toPush.length > 0) {
    await sb
      .from("scans")
      .upsert(toPush.map(entryToRow), { onConflict: "user_id,barcode" });
  }
}

/** Llamado por el AuthProvider cuando cambia la sesión. */
export function setHistoryUser(userId: string | null) {
  const changed = userId !== currentUserId;
  currentUserId = userId;
  if (userId && changed) void syncFromRemote();
}

// ---------------------------------------------------------------------------
// Escritura (local + remoto)
// ---------------------------------------------------------------------------

/** Registra un escaneo (mueve al frente si ya existía). */
export function recordScan(product: Product, evaluation: SumiEvaluation): void {
  const entry: HistoryEntry = {
    barcode: product.barcode,
    name: product.name,
    brand: product.brand,
    kind: product.kind,
    imageUrl: product.imageUrl,
    score: evaluation.score,
    level: evaluation.level,
    scannedAt: Date.now(),
  };
  const rest = read().filter((e) => e.barcode !== product.barcode);
  write([entry, ...rest]);
  void pushScan(entry);
}

/** Registra un producto no encontrado (queda como "desconocido"). */
export function recordUnknown(barcode: string): void {
  if (read().some((e) => e.barcode === barcode)) return;
  const entry: HistoryEntry = {
    barcode,
    name: "Producto desconocido",
    kind: "food",
    score: null,
    level: null,
    scannedAt: Date.now(),
  };
  write([entry, ...read()]);
  void pushScan(entry);
}

export function removeFromHistory(barcode: string): void {
  write(read().filter((e) => e.barcode !== barcode));
  void pushDelete(barcode);
}

export function clearHistory(): void {
  write([]);
  void pushClear();
}

// ---------------------------------------------------------------------------
// Síntesis
// ---------------------------------------------------------------------------

export interface Synthesis {
  excelente: number;
  bueno: number;
  mediocre: number;
  malo: number;
  desconocido: number;
}

/** Cuenta los productos del historial por nivel, filtrando por tipo. */
export function getSynthesis(kind: "food" | "cosmetic"): Synthesis {
  const counts: Synthesis = {
    excelente: 0,
    bueno: 0,
    mediocre: 0,
    malo: 0,
    desconocido: 0,
  };
  for (const e of read()) {
    const isCosmetic = e.kind === "cosmetic";
    if (kind === "cosmetic" ? !isCosmetic : isCosmetic) continue;
    if (e.level) counts[e.level] += 1;
    else counts.desconocido += 1;
  }
  return counts;
}
