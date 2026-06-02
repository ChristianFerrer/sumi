import Anthropic from "@anthropic-ai/sdk";
import type { Nutriments, Product } from "./types";

/**
 * Extraccion de datos de un producto a partir de la foto de su etiqueta,
 * usando Claude (vision). Es el flujo colaborativo de la V1: cuando un producto
 * no esta ni en la cache ni en Open Food Facts, el usuario fotografia la tabla
 * nutricional y la IA la lee por el.
 */

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "registrar_producto",
  description:
    "Registra los datos nutricionales leidos de la etiqueta de un producto peruano.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Nombre del producto" },
      brand: { type: "string", description: "Marca, si es visible" },
      is_beverage: {
        type: "boolean",
        description: "true si es una bebida/liquido (cambia los umbrales)",
      },
      // Todos los nutrientes SIEMPRE por 100 g (solido) o 100 ml (liquido).
      energy_kcal: { type: "number", description: "kcal por 100 g/ml" },
      sugars: { type: "number", description: "azucares totales en g por 100 g/ml" },
      saturated_fat: { type: "number", description: "grasas saturadas en g por 100 g/ml" },
      trans_fat: { type: "number", description: "grasas trans en g por 100 g/ml" },
      sodium: { type: "number", description: "sodio en mg por 100 g/ml" },
      fiber: { type: "number", description: "fibra en g por 100 g/ml" },
      proteins: { type: "number", description: "proteinas en g por 100 g/ml" },
      additives: {
        type: "array",
        items: { type: "string" },
        description: "codigos de aditivos detectados (ej. e150d, e951)",
      },
      nova_group: {
        type: "integer",
        description: "grupo NOVA de procesamiento estimado (1 a 4)",
      },
      readable: {
        type: "boolean",
        description: "false si la foto no permite leer la tabla nutricional",
      },
    },
    required: ["name", "is_beverage", "readable"],
  },
};

interface Extracted {
  readable: boolean;
  product?: Omit<Product, "barcode" | "source">;
}

/**
 * @param imageBase64 imagen en base64 (sin el prefijo data:)
 * @param mediaType   tipo MIME de la imagen
 */
export async function extractFromPhoto(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
): Promise<Extracted> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: "registrar_producto" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text:
              "Lee la etiqueta de este producto peruano. Extrae los valores nutricionales " +
              "SIEMPRE por 100 g (solidos) o 100 ml (bebidas) — si la tabla usa porciones, " +
              "conviertelos. Si no logras leer la tabla, marca readable=false.",
          },
        ],
      },
    ],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return { readable: false };

  const i = toolUse.input as Record<string, number | string | boolean | string[]>;
  if (i.readable === false) return { readable: false };

  const nutriments: Nutriments = {
    energyKcal: i.energy_kcal as number | undefined,
    sugars: i.sugars as number | undefined,
    saturatedFat: i.saturated_fat as number | undefined,
    transFat: i.trans_fat as number | undefined,
    sodium: i.sodium as number | undefined,
    fiber: i.fiber as number | undefined,
    proteins: i.proteins as number | undefined,
  };

  const nova = i.nova_group as number | undefined;
  const isBeverage = Boolean(i.is_beverage);

  return {
    readable: true,
    product: {
      name: (i.name as string) || "Producto sin nombre",
      brand: (i.brand as string) || undefined,
      kind: isBeverage ? "beverage" : "food",
      isBeverage,
      nutriments,
      novaGroup: nova && nova >= 1 && nova <= 4 ? (nova as 1 | 2 | 3 | 4) : undefined,
      additives: (i.additives as string[]) ?? [],
    },
  };
}
