import type { Nutriments, Octogono } from "./types";

/**
 * Parametros tecnicos de los octogonos de advertencia del Peru.
 * Ley N. 30021 (Ley de Promocion de la Alimentacion Saludable) y su reglamento.
 * Valores de la FASE 2 (definitiva), vigentes desde el 17 de setiembre de 2021.
 *
 * Los umbrales se expresan por 100 g (solidos) o por 100 ml (liquidos).
 * Un producto que ALCANZA O SUPERA el umbral debe llevar el octogono.
 *
 * Fuente: Manual de Advertencias Publicitarias / D.S. 017-2017-SA.
 */
export const UMBRALES_OCTOGONOS = {
  solido: {
    azucar: 10, // g de azucar total por 100 g
    sodio: 400, // mg de sodio por 100 g
    grasas_saturadas: 4, // g por 100 g
    // Grasas trans: usamos el estandar internacional "libre de trans"
    // (< 0.5 g/100 g). Por debajo de eso son trazas naturales (p.ej. las de
    // los lacteos) que no ameritan la advertencia "evitar su consumo".
    grasas_trans: 0.5,
  },
  liquido: {
    azucar: 5, // g de azucar total por 100 ml
    sodio: 100, // mg de sodio por 100 ml
    grasas_saturadas: 3, // g por 100 ml
    grasas_trans: 0.5, // g por 100 ml
  },
} as const;

const ETIQUETAS: Record<Octogono["nutrient"], string> = {
  azucar: "ALTO EN AZUCAR",
  sodio: "ALTO EN SODIO",
  grasas_saturadas: "ALTO EN GRASAS SATURADAS",
  grasas_trans: "CONTIENE GRASAS TRANS - EVITAR SU CONSUMO",
};

/**
 * Calcula que octogonos de advertencia le corresponderian a un producto
 * segun la normativa peruana, a partir de sus nutrientes.
 *
 * Esto replica el octogono oficial aunque el dato venga de Open Food Facts
 * o de la foto de un usuario, sin depender de que la marca lo declare.
 */
export function calcularOctogonos(
  nutriments: Nutriments,
  isBeverage: boolean,
): Octogono[] {
  const umbral = isBeverage ? UMBRALES_OCTOGONOS.liquido : UMBRALES_OCTOGONOS.solido;
  const octogonos: Octogono[] = [];

  if (nutriments.sugars != null && nutriments.sugars >= umbral.azucar) {
    octogonos.push({ nutrient: "azucar", label: ETIQUETAS.azucar });
  }
  if (nutriments.sodium != null && nutriments.sodium >= umbral.sodio) {
    octogonos.push({ nutrient: "sodio", label: ETIQUETAS.sodio });
  }
  if (
    nutriments.saturatedFat != null &&
    nutriments.saturatedFat >= umbral.grasas_saturadas
  ) {
    octogonos.push({
      nutrient: "grasas_saturadas",
      label: ETIQUETAS.grasas_saturadas,
    });
  }
  // Grasas trans: se advierten a partir del umbral (no por trazas naturales).
  if (
    nutriments.transFat != null &&
    nutriments.transFat >= umbral.grasas_trans
  ) {
    octogonos.push({ nutrient: "grasas_trans", label: ETIQUETAS.grasas_trans });
  }

  return octogonos;
}
