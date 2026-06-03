import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isPeruvianBarcode,
  normalizeOffProduct,
  searchPeruvianProducts,
} from "./openfoodfacts";

describe("isPeruvianBarcode", () => {
  it("reconoce el prefijo 775 de GS1 Peru", () => {
    expect(isPeruvianBarcode("7750182001234")).toBe(true);
    expect(isPeruvianBarcode("7501234567890")).toBe(false);
  });
});

describe("normalizeOffProduct", () => {
  it("mapea nutrientes, sal->sodio, aditivos y NOVA", () => {
    const p = normalizeOffProduct("7750000000001", {
      product_name: "Galleta de prueba",
      brands: "Marca",
      nova_group: 4,
      additives_tags: ["en:e322", "en:e503"],
      categories_tags: ["en:biscuits"],
      nutriments: {
        "energy-kcal_100g": 450,
        sugars_100g: 30,
        "saturated-fat_100g": 12,
        salt_100g: 1.25, // -> sodio 500 mg
        proteins_100g: 6,
      },
    });

    expect(p.barcode).toBe("7750000000001");
    expect(p.name).toBe("Galleta de prueba");
    expect(p.brand).toBe("Marca");
    expect(p.kind).toBe("food");
    expect(p.isBeverage).toBe(false);
    expect(p.novaGroup).toBe(4);
    expect(p.additives).toEqual(["e322", "e503"]);
    expect(p.nutriments.sodium).toBeCloseTo(500, 1);
    expect(p.source).toBe("openfoodfacts");
  });

  it("detecta bebidas por categoria", () => {
    const p = normalizeOffProduct("7750000000002", {
      product_name: "Gaseosa",
      categories_tags: ["en:beverages", "en:sodas"],
      nutriments: { sugars_100g: 11 },
    });
    expect(p.isBeverage).toBe(true);
    expect(p.kind).toBe("beverage");
  });

  it("usa nombre por defecto cuando falta", () => {
    const p = normalizeOffProduct("7750000000003", { nutriments: {} });
    expect(p.name).toBe("Producto sin nombre");
  });

  it("descarta valores fisicamente imposibles de OFF", () => {
    const p = normalizeOffProduct("7750000000004", {
      product_name: "Dato sucio",
      nutriments: {
        "energy-kcal_100g": 5000, // imposible -> se descarta
        sugars_100g: 250, // > 100 g -> se descarta
        proteins_100g: 8, // valido -> se conserva
        sodium_100g: 80, // 80 g -> 80000 mg, supera 40000 -> se descarta
      },
    });
    expect(p.nutriments.energyKcal).toBeUndefined();
    expect(p.nutriments.sugars).toBeUndefined();
    expect(p.nutriments.sodium).toBeUndefined();
    expect(p.nutriments.proteins).toBe(8);
  });
});

describe("searchPeruvianProducts", () => {
  afterEach(() => vi.restoreAllMocks());

  it("arma la URL con filtro de pais y parsea la respuesta", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          count: 2,
          page: 1,
          page_size: 100,
          products: [
            { code: "7750000000010", product_name: "Uno", nutriments: {} },
            { code: "7750000000011", product_name: "Dos", nutriments: {} },
            { product_name: "Sin code, se ignora", nutriments: {} },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await searchPeruvianProducts({ page: 1, pageSize: 100 });

    const calledUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(calledUrl.pathname).toContain("/search");
    expect(calledUrl.searchParams.get("countries_tags_en")).toBe("peru");
    expect(calledUrl.searchParams.get("page")).toBe("1");

    expect(res.count).toBe(2);
    expect(res.products).toHaveLength(2); // el producto sin code se descarta
    expect(res.products[0].barcode).toBe("7750000000010");
  });

  it("lanza si OFF responde con error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 503 })),
    );
    await expect(searchPeruvianProducts({})).rejects.toThrow(/503/);
  });
});
