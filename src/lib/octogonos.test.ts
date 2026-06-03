import { describe, expect, it } from "vitest";
import { calcularOctogonos, UMBRALES_OCTOGONOS } from "./octogonos";

describe("calcularOctogonos (Ley 30021, Fase 2)", () => {
  it("no marca octogonos a un producto limpio", () => {
    const o = calcularOctogonos(
      { sugars: 2, sodium: 100, saturatedFat: 1, transFat: 0 },
      false,
    );
    expect(o).toHaveLength(0);
  });

  it("marca ALTO EN AZUCAR en un solido con >= 10g de azucar", () => {
    const o = calcularOctogonos({ sugars: 10 }, false);
    expect(o.map((x) => x.nutrient)).toContain("azucar");
  });

  it("usa umbral mas estricto para bebidas (azucar 5g/100ml)", () => {
    // 6g de azucar: limpio como solido, pero octogono como bebida
    expect(calcularOctogonos({ sugars: 6 }, false)).toHaveLength(0);
    expect(
      calcularOctogonos({ sugars: 6 }, true).map((x) => x.nutrient),
    ).toContain("azucar");
  });

  it("marca sodio en solidos a partir de 400 mg", () => {
    expect(calcularOctogonos({ sodium: 399 }, false)).toHaveLength(0);
    expect(calcularOctogonos({ sodium: 400 }, false)).toHaveLength(1);
  });

  it("ignora trazas naturales de grasas trans (< 0.5 g) pero advierte desde el umbral", () => {
    // 0.1 g (p.ej. trazas naturales de la leche) no debe marcar octogono.
    expect(calcularOctogonos({ transFat: 0.1 }, false)).toHaveLength(0);
    // 0.5 g o mas si lo marca.
    expect(
      calcularOctogonos({ transFat: 0.5 }, false).map((x) => x.nutrient),
    ).toContain("grasas_trans");
  });

  it("puede acumular varios octogonos a la vez", () => {
    const o = calcularOctogonos(
      { sugars: 30, sodium: 500, saturatedFat: 8, transFat: 0.5 },
      false,
    );
    expect(o).toHaveLength(4);
  });

  it("expone los umbrales legales correctos", () => {
    expect(UMBRALES_OCTOGONOS.solido.azucar).toBe(10);
    expect(UMBRALES_OCTOGONOS.solido.sodio).toBe(400);
    expect(UMBRALES_OCTOGONOS.liquido.azucar).toBe(5);
    expect(UMBRALES_OCTOGONOS.liquido.sodio).toBe(100);
  });
});
