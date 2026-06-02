/**
 * Tipos compartidos del dominio Sumi.
 */

export type ProductKind = "food" | "beverage" | "cosmetic";

/** Nutrientes normalizados, siempre por 100 g (solidos) o 100 ml (liquidos). */
export interface Nutriments {
  /** Energia en kcal por 100 g/ml. */
  energyKcal?: number;
  /** Azucares totales en g por 100 g/ml. */
  sugars?: number;
  /** Grasas saturadas en g por 100 g/ml. */
  saturatedFat?: number;
  /** Grasas trans en g por 100 g/ml. */
  transFat?: number;
  /** Sodio en mg por 100 g/ml. */
  sodium?: number;
  /** Fibra en g por 100 g/ml. */
  fiber?: number;
  /** Proteinas en g por 100 g/ml. */
  proteins?: number;
  /** % estimado de frutas, verduras, legumbres y frutos secos. */
  fruitsVegetablesNuts?: number;
}

/** Producto normalizado, agnostico de la fuente (OFF, Supabase, foto + IA). */
export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  kind: ProductKind;
  /** true si es un liquido (cambia los umbrales de octogonos y Nutri-Score). */
  isBeverage: boolean;
  nutriments: Nutriments;
  /** Grupo NOVA de procesamiento (1 a 4). */
  novaGroup?: 1 | 2 | 3 | 4;
  /** Codigos de aditivos, p.ej. "e150d", "e951". */
  additives: string[];
  imageUrl?: string;
  /** De donde salieron los datos. */
  source: "openfoodfacts" | "sumi-db" | "user-photo";
}

/** Un octogono de advertencia peruano (Ley 30021). */
export interface Octogono {
  nutrient: "azucar" | "sodio" | "grasas_saturadas" | "grasas_trans";
  label: string;
}

export type GradeLevel = "excelente" | "bueno" | "mediocre" | "malo";

/** Resultado completo de la evaluacion de un producto. */
export interface SumiEvaluation {
  /** Nota global 0-100. */
  score: number;
  level: GradeLevel;
  octogonos: Octogono[];
  /** Desglose para mostrar el "por que". */
  breakdown: {
    nutrition: number;
    additives: number;
    processing: number;
  };
  /** Mensajes legibles que explican la nota (el "por que" de Sumi). */
  reasons: string[];
}
