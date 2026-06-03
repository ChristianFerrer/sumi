/**
 * Genera el SQL para sembrar productos peruanos en la base.
 * La nota, nivel y octogonos se calculan con el motor Sumi-Score para que sean
 * coherentes con la app. Ejecutar con: npx vite-node scripts/seed-products.ts
 */
import { evaluateProduct } from "../src/lib/sumi-score";
import type { Product } from "../src/lib/types";

type Seed = Omit<Product, "source"> & { category: string };

const N = (
  energyKcal?: number,
  sugars?: number,
  saturatedFat?: number,
  sodium?: number,
  fiber?: number,
  proteins?: number,
  fruitsVegetablesNuts?: number,
  transFat?: number,
) => ({ energyKcal, sugars, saturatedFat, sodium, fiber, proteins, fruitsVegetablesNuts, transFat });

const seeds: Seed[] = [
  // --- Gaseosas y bebidas azucaradas (beverage) ---
  { barcode: "7750182001234", name: "Inca Kola", brand: "Inca Kola", kind: "beverage", isBeverage: true, category: "gaseosas", nutriments: N(43, 11, 0, 8), novaGroup: 4, additives: ["e150d", "e211"] },
  { barcode: "7750182005678", name: "Coca-Cola", brand: "Coca-Cola", kind: "beverage", isBeverage: true, category: "gaseosas", nutriments: N(42, 10.6, 0, 8), novaGroup: 4, additives: ["e150d", "e338"] },
  { barcode: "7750182009012", name: "Coca-Cola Sin Azúcar", brand: "Coca-Cola", kind: "beverage", isBeverage: true, category: "gaseosas", nutriments: N(0.3, 0, 0, 10), novaGroup: 4, additives: ["e150d", "e950", "e951"] },
  { barcode: "7751271110017", name: "Sporade Mandarina", brand: "Sporade", kind: "beverage", isBeverage: true, category: "rehidratantes", nutriments: N(26, 6, 0, 40), novaGroup: 4, additives: ["e110", "e211"] },
  { barcode: "7751271220028", name: "Cifrut Citrus Punch", brand: "Cifrut", kind: "beverage", isBeverage: true, category: "refrescos", nutriments: N(38, 9, 0, 12), novaGroup: 4, additives: ["e110", "e211", "e951"] },
  { barcode: "7751271330039", name: "Frugos Néctar Durazno", brand: "Frugos", kind: "beverage", isBeverage: true, category: "nectares", nutriments: N(54, 12, 0, 5, 0.3, 0.4, 30), novaGroup: 4, additives: ["e330"] },
  { barcode: "7751271440049", name: "Agua San Luis sin gas", brand: "San Luis", kind: "beverage", isBeverage: true, category: "aguas", nutriments: N(0, 0, 0, 2), novaGroup: 1, additives: [] },
  { barcode: "7751271550059", name: "Pulp Durazno", brand: "Pulp", kind: "beverage", isBeverage: true, category: "nectares", nutriments: N(50, 11, 0, 6, 0.2, 0.3, 20), novaGroup: 4, additives: ["e330", "e211"] },

  // --- Galletas (food) ---
  { barcode: "7751271600010", name: "Galleta Soda Field", brand: "Field", kind: "food", isBeverage: false, category: "galletas", nutriments: N(435, 8, 6, 600, 2, 9), novaGroup: 4, additives: ["e500", "e322"] },
  { barcode: "7751271600027", name: "Galleta Casino", brand: "Victoria", kind: "food", isBeverage: false, category: "galletas", nutriments: N(490, 35, 12, 250, 1.5, 5), novaGroup: 4, additives: ["e322", "e503", "e150d"] },
  { barcode: "7751271600034", name: "Galleta Vainilla", brand: "Margarita", kind: "food", isBeverage: false, category: "galletas", nutriments: N(460, 24, 8, 300, 1.2, 6), novaGroup: 4, additives: ["e322", "e503"] },
  { barcode: "7751271600041", name: "Galleta Integral con Fibra", brand: "Fitness", kind: "food", isBeverage: false, category: "galletas", nutriments: N(420, 12, 3, 280, 7, 9), novaGroup: 3, additives: ["e322"] },

  // --- Cereales y avenas (food) ---
  { barcode: "7751271700017", name: "Zucaritas", brand: "Ángel", kind: "food", isBeverage: false, category: "cereales", nutriments: N(380, 35, 0.5, 180, 2, 6), novaGroup: 4, additives: ["e160a", "e150c"] },
  { barcode: "7751271700024", name: "Avena Tradicional", brand: "Quaker", kind: "food", isBeverage: false, category: "cereales", nutriments: N(372, 1, 1.3, 5, 10, 13), novaGroup: 1, additives: [] },
  { barcode: "7751271700031", name: "Hojuelas de Quinua", brand: "Santa Catalina", kind: "food", isBeverage: false, category: "cereales", nutriments: N(368, 2, 0.7, 5, 7, 14), novaGroup: 1, additives: [] },

  // --- Snacks (food) ---
  { barcode: "7751271800014", name: "Papas Lay's Clásicas", brand: "Lay's", kind: "food", isBeverage: false, category: "snacks", nutriments: N(536, 0.5, 10, 480, 4, 6), novaGroup: 4, additives: ["e621"] },
  { barcode: "7751271800021", name: "Chifles de Plátano", brand: "Inka Chips", kind: "food", isBeverage: false, category: "snacks", nutriments: N(520, 1, 8, 350, 3, 2), novaGroup: 3, additives: [] },
  { barcode: "7751271800038", name: "Maní Salado", brand: "Tía", kind: "food", isBeverage: false, category: "snacks", nutriments: N(580, 4, 7, 420, 8, 25), novaGroup: 3, additives: [] },
  { barcode: "7751271800045", name: "Chocolate Sublime", brand: "Sublime", kind: "food", isBeverage: false, category: "golosinas", nutriments: N(540, 48, 18, 60, 2, 7, 0, 0.4), novaGroup: 4, additives: ["e322", "e476"] },

  // --- Lácteos (food) ---
  { barcode: "7751271900011", name: "Leche Evaporada Gloria", brand: "Gloria", kind: "food", isBeverage: false, category: "lacteos", nutriments: N(135, 10, 4.5, 110, 0, 7), novaGroup: 3, additives: ["e339"] },
  { barcode: "7751271900028", name: "Yogurt Fresa", brand: "Gloria", kind: "food", isBeverage: false, category: "yogures", nutriments: N(85, 13, 1.5, 55, 0, 3), novaGroup: 4, additives: ["e120", "e1442"] },
  { barcode: "7751271900035", name: "Yogurt Griego Natural", brand: "Laive", kind: "food", isBeverage: false, category: "yogures", nutriments: N(97, 4, 2.5, 45, 0, 9), novaGroup: 3, additives: [] },

  // --- Abarrotes saludables (food) ---
  { barcode: "7758029000010", name: "Quinua en grano", brand: "Wong", kind: "food", isBeverage: false, category: "granos", nutriments: N(368, 1.5, 0.7, 5, 7, 14), novaGroup: 1, additives: [] },
  { barcode: "7758029000027", name: "Kiwicha en grano", brand: "Wong", kind: "food", isBeverage: false, category: "granos", nutriments: N(371, 1.7, 1.6, 4, 6.7, 14), novaGroup: 1, additives: [] },
  { barcode: "7758029000034", name: "Lenteja", brand: "Costeño", kind: "food", isBeverage: false, category: "menestras", nutriments: N(352, 2, 0.4, 6, 11, 24), novaGroup: 1, additives: [] },
  { barcode: "7758029000041", name: "Atún en Agua", brand: "Florida", kind: "food", isBeverage: false, category: "conservas", nutriments: N(110, 0, 0.5, 320, 0, 25), novaGroup: 3, additives: [] },
  { barcode: "7758029000058", name: "Atún en Aceite", brand: "Florida", kind: "food", isBeverage: false, category: "conservas", nutriments: N(200, 0, 3, 400, 0, 24), novaGroup: 3, additives: [] },

  // --- Cosmeticos (placeholder: el algoritmo propio llega en una fase futura) ---
  { barcode: "7752000000017", name: "Jabón de Glicerina", brand: "Deliplus", kind: "cosmetic", isBeverage: false, category: "higiene", nutriments: N(), additives: [] },
  { barcode: "7752000000024", name: "Shampoo Sávila", brand: "Natura", kind: "cosmetic", isBeverage: false, category: "cuidado-cabello", nutriments: N(), additives: [] },
];

const lines = seeds.map((s) => {
  const isCosmetic = s.kind === "cosmetic";
  const e = isCosmetic ? null : evaluateProduct({ ...s, source: "sumi-db" });
  const nutr = JSON.stringify(s.nutriments).replace(/'/g, "''");
  const oct = JSON.stringify(e?.octogonos ?? []).replace(/'/g, "''");
  const name = s.name.replace(/'/g, "''");
  const brand = s.brand?.replace(/'/g, "''") ?? "";
  return `('${s.barcode}','${name}','${brand}','${s.kind}',${s.isBeverage},'${s.category}','${nutr}'::jsonb,${s.novaGroup ?? "null"},'{${s.additives.join(",")}}','sumi-db',${e ? e.score : "null"},${e ? `'${e.level}'` : "null"},'${oct}'::jsonb)`;
});

console.log(`insert into public.products
  (barcode,name,brand,kind,is_beverage,category,nutriments,nova_group,additives,source,score,level,octogonos)
values
${lines.join(",\n")}
on conflict (barcode) do update set
  name=excluded.name, brand=excluded.brand, kind=excluded.kind,
  is_beverage=excluded.is_beverage, category=excluded.category,
  nutriments=excluded.nutriments, nova_group=excluded.nova_group,
  additives=excluded.additives, score=excluded.score, level=excluded.level,
  octogonos=excluded.octogonos;`);
