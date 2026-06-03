"use client";

import type { GradeLevel, Product, SumiEvaluation } from "./types";

/**
 * Historial de productos escaneados, guardado en el dispositivo (localStorage).
 * Alimenta las pantallas Historial, Sintesis y Alternativas.
 *
 * V2: sincronizar con la cuenta del usuario en Supabase para tenerlo en todos
 * sus dispositivos.
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

/** Registra un escaneo (mueve al frente si ya existia). */
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
}

/** Registra un producto no encontrado (queda como "desconocido"). */
export function recordUnknown(barcode: string): void {
  if (read().some((e) => e.barcode === barcode)) return;
  write([
    {
      barcode,
      name: "Producto desconocido",
      kind: "food",
      score: null,
      level: null,
      scannedAt: Date.now(),
    },
    ...read(),
  ]);
}

export function removeFromHistory(barcode: string): void {
  write(read().filter((e) => e.barcode !== barcode));
}

export function clearHistory(): void {
  write([]);
}

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
