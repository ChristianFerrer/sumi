import { describe, expect, it } from "vitest";
import { hasNutrition, isWorthStoring, toProductRow } from "./off-import";
import type { Product } from "./types";

function product(overrides: Partial<Product> = {}): Product {
  return {
    barcode: "7750000000001",
    name: "Producto",
    kind: "food",
    isBeverage: false,
    nutriments: {},
    additives: [],
    source: "openfoodfacts",
    ...overrides,
  };
}

describe("hasNutrition", () => {
  it("es true si hay al menos un nutriente clave", () => {
    expect(hasNutrition({ energyKcal: 100 })).toBe(true);
    expect(hasNutrition({ sodium: 5 })).toBe(true);
  });
  it("es false con nutrientes vacios", () => {
    expect(hasNutrition({})).toBe(false);
    expect(hasNutrition({ fiber: 2 })).toBe(false); // fibra sola no basta
  });
});

describe("isWorthStoring", () => {
  it("guarda si tiene nombre real", () => {
    expect(isWorthStoring(product({ name: "Inca Kola" }))).toBe(true);
  });
  it("guarda si tiene nutricion o imagen aunque no tenga nombre", () => {
    expect(
      isWorthStoring(product({ name: "Producto sin nombre", nutriments: { sugars: 10 } })),
    ).toBe(true);
    expect(
      isWorthStoring(product({ name: "Producto sin nombre", imageUrl: "http://x/y.jpg" })),
    ).toBe(true);
  });
  it("descarta basura sin nombre, sin datos y sin foto", () => {
    expect(isWorthStoring(product({ name: "Producto sin nombre" }))).toBe(false);
  });
});

describe("toProductRow", () => {
  it("puntua alimentos con datos nutricionales", () => {
    const row = toProductRow(
      product({
        name: "Galleta",
        nutriments: { energyKcal: 450, sugars: 30, saturatedFat: 12, sodium: 500 },
        novaGroup: 4,
        additives: ["e322"],
      }),
    );
    expect(row.score).not.toBeNull();
    expect(row.level).not.toBeNull();
    expect(Array.isArray(row.octogonos)).toBe(true);
    expect(row.source).toBe("openfoodfacts");
  });

  it("deja score nulo cuando no hay nutricion (pendiente de datos)", () => {
    const row = toProductRow(product({ name: "Algo", nutriments: {} }));
    expect(row.score).toBeNull();
    expect(row.level).toBeNull();
    expect(row.octogonos).toEqual([]);
  });

  it("no puntua cosmeticos", () => {
    const row = toProductRow(
      product({ kind: "cosmetic", name: "Shampoo", nutriments: { energyKcal: 1 } }),
    );
    expect(row.score).toBeNull();
  });
});
