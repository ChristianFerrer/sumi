import type { Nutriments } from "./types";

/**
 * Implementacion del Nutri-Score (version clasica 2017) para alimentos
 * generales y bebidas. Es la base de la calidad nutricional, igual que en Yuka.
 *
 * El calculo trabaja siempre con valores por 100 g (solido) o 100 ml (bebida).
 */

export type NutriGrade = "A" | "B" | "C" | "D" | "E";

export interface NutriScoreResult {
  points: number;
  grade: NutriGrade;
}

/** Devuelve el indice del primer umbral que el valor NO supera. */
function pointsFromThresholds(value: number, thresholds: number[]): number {
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) return i;
  }
  return thresholds.length;
}

// --- Puntos negativos (a mas, peor) ---
const ENERGY_KJ = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
const ENERGY_KJ_BEV = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300];
const SUGARS = [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45];
const SUGARS_BEV = [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5, 12, 13.5];
const SAT_FAT = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SODIUM_MG = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900];

// --- Puntos positivos (a mas, mejor) ---
const FIBER = [0.9, 1.9, 2.8, 3.7, 4.7];
const PROTEIN = [1.6, 3.2, 4.8, 6.4, 8];

function fruitPoints(percent: number, isBeverage: boolean): number {
  if (isBeverage) {
    if (percent <= 40) return 0;
    if (percent <= 60) return 2;
    if (percent <= 80) return 4;
    return 10;
  }
  if (percent <= 40) return 0;
  if (percent <= 60) return 1;
  if (percent <= 80) return 2;
  return 5;
}

const KCAL_TO_KJ = 4.184;

export function computeNutriScore(
  n: Nutriments,
  isBeverage: boolean,
): NutriScoreResult {
  const energyKj = (n.energyKcal ?? 0) * KCAL_TO_KJ;

  const energyPts = pointsFromThresholds(
    energyKj,
    isBeverage ? ENERGY_KJ_BEV : ENERGY_KJ,
  );
  const sugarsPts = pointsFromThresholds(
    n.sugars ?? 0,
    isBeverage ? SUGARS_BEV : SUGARS,
  );
  const satFatPts = pointsFromThresholds(n.saturatedFat ?? 0, SAT_FAT);
  const sodiumPts = pointsFromThresholds(n.sodium ?? 0, SODIUM_MG);
  const negative = energyPts + sugarsPts + satFatPts + sodiumPts;

  const fiberPts = pointsFromThresholds(n.fiber ?? 0, FIBER);
  const proteinPts = pointsFromThresholds(n.proteins ?? 0, PROTEIN);
  const fruitPts = fruitPoints(n.fruitsVegetablesNuts ?? 0, isBeverage);

  // Regla clasica: si negative >= 11 y la fruta no llega al maximo,
  // la proteina no se cuenta (salvo bebidas).
  let positive: number;
  if (negative >= 11 && fruitPts < (isBeverage ? 10 : 5)) {
    positive = fiberPts + fruitPts;
  } else {
    positive = fiberPts + proteinPts + fruitPts;
  }

  const points = negative - positive;
  return { points, grade: gradeFromPoints(points, isBeverage) };
}

function gradeFromPoints(points: number, isBeverage: boolean): NutriGrade {
  if (isBeverage) {
    // El agua es la unica bebida "A". El resto arranca peor.
    if (points <= 1) return "B";
    if (points <= 5) return "C";
    if (points <= 9) return "D";
    return "E";
  }
  if (points <= -1) return "A";
  if (points <= 2) return "B";
  if (points <= 10) return "C";
  if (points <= 18) return "D";
  return "E";
}
