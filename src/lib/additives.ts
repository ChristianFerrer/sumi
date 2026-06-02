/**
 * Clasificacion de riesgo de aditivos alimentarios.
 *
 * Sumi clasifica cada aditivo (codigo E) en un nivel de riesgo, igual que Yuka.
 * Este es un subconjunto representativo para el MVP; se ampliara con la base
 * abierta de Open Food Facts (taxonomia de aditivos) en la fase V1.
 */

export type AdditiveRisk = "none" | "limited" | "moderate" | "high";

/** Penalizacion en puntos (sobre 100) que aplica cada nivel de riesgo. */
export const RISK_PENALTY: Record<AdditiveRisk, number> = {
  none: 0,
  limited: 10,
  moderate: 30,
  high: 100,
};

/** Mapa de codigo E -> riesgo. Codigo normalizado en minusculas, sin espacios. */
export const ADDITIVE_RISK: Record<string, AdditiveRisk> = {
  // Colorantes de alto riesgo / controversiales
  e102: "high", // tartrazina
  e110: "high", // amarillo ocaso
  e129: "high", // rojo allura
  e150d: "moderate", // caramelo IV (sulfito de amonio)
  e171: "high", // dioxido de titanio
  // Conservantes
  e211: "moderate", // benzoato de sodio
  e220: "moderate", // dioxido de azufre
  e249: "high", // nitrito de potasio
  e250: "high", // nitrito de sodio
  e621: "limited", // glutamato monosodico (MSG)
  // Edulcorantes
  e950: "limited", // acesulfamo K
  e951: "moderate", // aspartamo
  e955: "limited", // sucralosa
  // Bajo / sin riesgo conocido
  e300: "none", // acido ascorbico (vit C)
  e330: "none", // acido citrico
  e322: "none", // lecitinas
  e440: "none", // pectinas
};

export function riskForAdditive(code: string): AdditiveRisk {
  const normalized = code.toLowerCase().replace(/[^a-z0-9]/g, "");
  // Por defecto, un aditivo desconocido se trata como riesgo limitado:
  // mejor pecar de prudente, como hace Yuka.
  return ADDITIVE_RISK[normalized] ?? "limited";
}
