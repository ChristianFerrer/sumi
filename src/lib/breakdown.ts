import type { Product } from "./types";
import { riskForAdditive, type AdditiveRisk } from "./additives";

/**
 * Desglose detallado de un producto, estilo Yuka: secciones Negativo y Positivo,
 * cada nutriente con su valor, una etiqueta cualitativa, un color y una escala.
 *
 * Las escalas se basan en los umbrales del Nutri-Score (los mismos que usa el
 * motor Sumi-Score), para que la nota y el detalle sean coherentes.
 */

const NEG_COLORS = ["#16a34a", "#84cc16", "#f59e0b", "#dc2626"];
const POS_COLORS = ["#bbf7d0", "#4ade80", "#16a34a"];
const SLATE = "#94a3b8";

export interface Scale {
  marks: number[];
  colors: string[];
  markerPct: number;
  /** Indice de la zona donde cae el valor. */
  zone: number;
}

export interface AdditiveDetail {
  code: string;
  risk: AdditiveRisk;
  color: string;
}

export interface BreakdownRow {
  key: string;
  iconKey: string;
  title: string;
  qualifier: string;
  valueLabel: string;
  dotColor: string;
  scale?: Scale;
  additives?: AdditiveDetail[];
}

export interface Breakdown {
  negativo: BreakdownRow[];
  positivo: BreakdownRow[];
  perUnit: string;
}

const RISK_COLOR: Record<AdditiveRisk, string> = {
  none: "#16a34a",
  limited: "#84cc16",
  moderate: "#f59e0b",
  high: "#dc2626",
};

/** Posicion del marcador (0-100%) mapeando el valor sobre marcas equiespaciadas. */
function markerPercent(value: number, marks: number[]): number {
  const last = marks.length - 1;
  if (value <= marks[0]) return 0;
  if (value >= marks[last]) return 100;
  const seg = 100 / last;
  for (let i = 0; i < last; i++) {
    if (value >= marks[i] && value < marks[i + 1]) {
      return i * seg + ((value - marks[i]) / (marks[i + 1] - marks[i])) * seg;
    }
  }
  return 100;
}

/** Zona (0..n-1) segun cuantos limites internos supera el valor. */
function zoneIndex(value: number, marks: number[]): number {
  const boundaries = marks.slice(1, -1);
  let z = 0;
  for (const b of boundaries) if (value > b) z++;
  return z;
}

function fmt(value: number, unit: string): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}${unit}`;
}

function negRow(
  key: string,
  iconKey: string,
  title: string,
  unit: string,
  marks: number[],
  labels: string[],
  value: number | undefined,
): BreakdownRow | null {
  if (value == null) return null;
  const zone = zoneIndex(value, marks);
  return {
    key,
    iconKey,
    title,
    qualifier: labels[zone],
    valueLabel: fmt(value, unit),
    dotColor: NEG_COLORS[zone],
    scale: { marks, colors: NEG_COLORS, markerPct: markerPercent(value, marks), zone },
  };
}

function posRow(
  key: string,
  iconKey: string,
  title: string,
  unit: string,
  marks: number[],
  labels: string[],
  value: number | undefined,
): BreakdownRow | null {
  if (value == null) return null;
  const zone = zoneIndex(value, marks);
  return {
    key,
    iconKey,
    title,
    qualifier: labels[zone],
    valueLabel: fmt(value, unit),
    dotColor: zone === 0 ? SLATE : "#16a34a",
    scale: { marks, colors: POS_COLORS, markerPct: markerPercent(value, marks), zone },
  };
}

function additivesRow(additives: string[]): BreakdownRow {
  const detail: AdditiveDetail[] = additives.map((code) => {
    const risk = riskForAdditive(code);
    return { code: code.toUpperCase().replace(/^EN:/, ""), risk, color: RISK_COLOR[risk] };
  });
  const worst = detail.reduce<AdditiveRisk>((acc, d) => {
    const order: AdditiveRisk[] = ["none", "limited", "moderate", "high"];
    return order.indexOf(d.risk) > order.indexOf(acc) ? d.risk : acc;
  }, "none");

  let qualifier = "Sin aditivos";
  if (detail.length > 0) {
    qualifier =
      worst === "high"
        ? "Aditivos a evitar"
        : worst === "moderate"
          ? "Algunos aditivos a evitar"
          : "Aditivos de bajo riesgo";
  }

  return {
    key: "additives",
    iconKey: "additives",
    title: "Aditivos",
    qualifier,
    valueLabel: String(detail.length),
    dotColor: detail.length === 0 ? "#16a34a" : RISK_COLOR[worst],
    additives: detail,
  };
}

export function computeBreakdown(product: Product): Breakdown {
  const n = product.nutriments;

  const negativo = [
    additivesRow(product.additives),
    negRow("energy", "energy", "Calorías", " kcal", [0, 100, 200, 300, 400],
      ["Poco calórico", "Moderado", "Calórico", "Muy calórico"], n.energyKcal),
    negRow("sugars", "sugar", "Azúcar", "g", [0, 9, 18, 31, 45],
      ["Bajo en azúcar", "Poco dulce", "Dulce", "Demasiado dulce"], n.sugars),
    negRow("satfat", "satfat", "Grasas saturadas", "g", [0, 2, 4, 6, 10],
      ["Buena cantidad", "Moderada", "Mucha", "Demasiada"], n.saturatedFat),
    negRow("sodium", "sodium", "Sodio", " mg", [0, 100, 200, 400, 900],
      ["Poco sodio", "Moderado", "Alto", "Demasiado sodio"], n.sodium),
  ].filter((r): r is BreakdownRow => r !== null);

  const positivo = [
    posRow("fruits", "fruits", "Frutas, verduras y frutos secos", "%", [0, 40, 80, 100],
      ["Poca cantidad", "Buena cantidad", "Excelente cantidad"], n.fruitsVegetablesNuts),
    posRow("fiber", "fiber", "Fibra", "g", [0, 1.5, 3, 4.7],
      ["Poca fibra", "Buena cantidad", "Mucha fibra"], n.fiber),
    posRow("proteins", "proteins", "Proteínas", "g", [0, 3, 5, 8],
      ["Pocas proteínas", "Algunas proteínas", "Buena cantidad"], n.proteins),
  ].filter((r): r is BreakdownRow => r !== null);

  return {
    negativo,
    positivo,
    perUnit: product.isBeverage ? "por 100 ml" : "por 100 g",
  };
}
