import type { GradeLevel, Product, SumiEvaluation } from "./types";
import { computeNutriScore } from "./nutri-score";
import { calcularOctogonos } from "./octogonos";
import { RISK_PENALTY, riskForAdditive } from "./additives";

/**
 * Motor de puntuacion Sumi.
 *
 * Inspirado en la metodologia de Yuka (60% nutricion + 30% aditivos +
 * 10% procesamiento), pero adaptado al Peru: los octogonos de la Ley 30021
 * limitan la nota maxima. Asi un producto "alto en azucar" nunca puede salir
 * como excelente, por buenos que sean sus otros indicadores.
 */

const WEIGHTS = { nutrition: 0.6, additives: 0.3, processing: 0.1 };

// Rango de puntos del Nutri-Score que mapeamos a 0-100.
const NUTRI_BEST = -15;
const NUTRI_WORST = 40;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/** Convierte los puntos del Nutri-Score (mejor = bajo) a un subscore 0-100. */
function nutritionSubscore(points: number): number {
  const ratio = (NUTRI_WORST - points) / (NUTRI_WORST - NUTRI_BEST);
  return clamp(Math.round(ratio * 100));
}

function additivesSubscore(additives: string[]): number {
  let penalty = 0;
  for (const code of additives) {
    penalty += RISK_PENALTY[riskForAdditive(code)];
  }
  return clamp(100 - penalty);
}

function processingSubscore(novaGroup?: number): number {
  switch (novaGroup) {
    case 1:
      return 100;
    case 2:
      return 70;
    case 3:
      return 40;
    case 4:
      return 0;
    default:
      return 50; // desconocido: neutral
  }
}

function levelFromScore(score: number): GradeLevel {
  if (score >= 76) return "excelente";
  if (score >= 51) return "bueno";
  if (score >= 26) return "mediocre";
  return "malo";
}

export function evaluateProduct(product: Product): SumiEvaluation {
  const { nutriments, isBeverage, additives, novaGroup } = product;

  const nutri = computeNutriScore(nutriments, isBeverage);
  const nutrition = nutritionSubscore(nutri.points);
  const additivesScore = additivesSubscore(additives);
  const processing = processingSubscore(novaGroup);

  let score = Math.round(
    nutrition * WEIGHTS.nutrition +
      additivesScore * WEIGHTS.additives +
      processing * WEIGHTS.processing,
  );

  const octogonos = calcularOctogonos(nutriments, isBeverage);

  // Regla peruana: los octogonos limitan la nota maxima posible.
  // Cada octogono nutricional la baja a lo mucho a 50; las grasas trans, a 25.
  const reasons: string[] = [];
  if (octogonos.length > 0) {
    const hasTrans = octogonos.some((o) => o.nutrient === "grasas_trans");
    const cap = hasTrans ? 25 : 50;
    if (score > cap) {
      score = cap;
      reasons.push(
        `Limitado a ${cap}/100 por llevar ${octogonos.length} octogono(s) de advertencia.`,
      );
    }
    for (const o of octogonos) {
      reasons.push(o.label);
    }
  }

  // Explicaciones del "por que" (el valor que el octogono solo no da).
  if (nutrition < 40) reasons.push("Perfil nutricional desfavorable.");
  if (additivesScore < 70) reasons.push("Contiene aditivos de riesgo.");
  if (novaGroup === 4) reasons.push("Producto ultraprocesado (NOVA 4).");
  if (reasons.length === 0) reasons.push("Buen perfil general. Igual, modera.");

  return {
    score,
    level: levelFromScore(score),
    octogonos,
    breakdown: { nutrition, additives: additivesScore, processing },
    reasons,
  };
}
