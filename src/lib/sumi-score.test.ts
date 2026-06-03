import { describe, expect, it } from "vitest";
import { evaluateProduct } from "./sumi-score";
import type { Product } from "./types";

function makeProduct(overrides: Partial<Product>): Product {
  return {
    barcode: "7750000000000",
    name: "Test",
    kind: "food",
    isBeverage: false,
    nutriments: {},
    additives: [],
    source: "openfoodfacts",
    ...overrides,
  };
}

describe("evaluateProduct", () => {
  it("da nota alta a un producto saludable y simple", () => {
    const p = makeProduct({
      nutriments: {
        energyKcal: 50,
        sugars: 1,
        saturatedFat: 0.2,
        sodium: 20,
        fiber: 4,
        proteins: 5,
        fruitsVegetablesNuts: 90,
      },
      novaGroup: 1,
    });
    const e = evaluateProduct(p);
    expect(e.score).toBeGreaterThanOrEqual(76);
    expect(e.level).toBe("excelente");
    expect(e.octogonos).toHaveLength(0);
  });

  it("un producto con octogono nunca supera 50, aunque tenga buen perfil", () => {
    const p = makeProduct({
      nutriments: {
        energyKcal: 100,
        sugars: 30, // octogono de azucar
        saturatedFat: 0.5,
        sodium: 10,
        fiber: 5,
        proteins: 6,
        fruitsVegetablesNuts: 80,
      },
      novaGroup: 1,
    });
    const e = evaluateProduct(p);
    expect(e.octogonos.map((o) => o.nutrient)).toContain("azucar");
    expect(e.score).toBeLessThanOrEqual(50);
  });

  it("las grasas trans (desde el umbral) limitan la nota a 25", () => {
    const p = makeProduct({
      nutriments: { sugars: 1, sodium: 10, saturatedFat: 0.1, transFat: 0.6 },
    });
    const e = evaluateProduct(p);
    expect(e.octogonos.map((o) => o.nutrient)).toContain("grasas_trans");
    expect(e.score).toBeLessThanOrEqual(25);
  });

  it("penaliza ultraprocesados y aditivos de alto riesgo", () => {
    const limpio = evaluateProduct(
      makeProduct({ nutriments: { sugars: 3, sodium: 50 }, novaGroup: 1 }),
    );
    const malo = evaluateProduct(
      makeProduct({
        nutriments: { sugars: 3, sodium: 50 },
        novaGroup: 4,
        additives: ["e102", "e951"],
      }),
    );
    expect(malo.score).toBeLessThan(limpio.score);
  });

  it("siempre devuelve al menos una razon", () => {
    const e = evaluateProduct(makeProduct({}));
    expect(e.reasons.length).toBeGreaterThan(0);
  });
});
