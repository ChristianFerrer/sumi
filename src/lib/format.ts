import type { GradeLevel } from "./types";

export const LEVEL_META: Record<
  GradeLevel,
  { label: string; color: string; text: string }
> = {
  excelente: { label: "Excelente", color: "#16a34a", text: "text-grade-excellent" },
  bueno: { label: "Bueno", color: "#84cc16", text: "text-grade-good" },
  mediocre: { label: "Mediocre", color: "#f59e0b", text: "text-grade-poor" },
  malo: { label: "Malo", color: "#dc2626", text: "text-grade-bad" },
};

export const UNKNOWN_COLOR = "#cbd5e1";

/** Tiempo relativo en español: "hoy", "ayer", "la semana pasada", "hace 3 semanas". */
export function relativeTime(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "la semana pasada";
  if (weeks < 5) return `hace ${weeks} semanas`;
  const months = Math.floor(days / 30);
  if (months === 1) return "el mes pasado";
  return `hace ${months} meses`;
}
