import { ShoppingBasket, Lightbulb } from "lucide-react";
import type { Product, SumiEvaluation } from "@/lib/types";
import { computeBreakdown } from "@/lib/breakdown";
import { LEVEL_META } from "@/lib/format";
import { OctagonWarnings } from "./OctagonWarnings";
import { NutrientRow } from "./NutrientRow";

function SectionHeader({ title, unit }: { title: string; unit: string }) {
  return (
    <div className="mb-1 mt-6 flex items-baseline justify-between">
      <h3 className="text-xl font-extrabold">{title}</h3>
      <span className="text-sm text-slate-400">{unit}</span>
    </div>
  );
}

export function ProductResult({
  product,
  evaluation,
}: {
  product: Product;
  evaluation: SumiEvaluation;
}) {
  const breakdown = computeBreakdown(product);
  const meta = LEVEL_META[evaluation.level];

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-start gap-4">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-28 w-28 shrink-0 rounded-xl object-contain"
          />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <ShoppingBasket size={36} strokeWidth={1.5} />
          </div>
        )}
        <div className="min-w-0 pt-1">
          <h2 className="text-2xl font-extrabold leading-tight">{product.name}</h2>
          {product.brand && <p className="text-slate-500">{product.brand}</p>}
          <div className="mt-3 flex items-center gap-2.5">
            <span
              className="inline-block h-4 w-4 rounded-full"
              style={{ backgroundColor: meta.color }}
            />
            <span className="text-2xl font-bold">{evaluation.score}/100</span>
            <span className="text-slate-500">{meta.label}</span>
          </div>
        </div>
      </div>

      {/* Octogonos peruanos (el sello distintivo de Sumi) */}
      {evaluation.octogonos.length > 0 && (
        <div className="mt-4">
          <OctagonWarnings octogonos={evaluation.octogonos} />
        </div>
      )}

      {/* Negativo */}
      {breakdown.negativo.length > 0 && (
        <>
          <SectionHeader title="Negativo" unit={breakdown.perUnit} />
          <div>
            {breakdown.negativo.map((row) => (
              <NutrientRow key={row.key} row={row} />
            ))}
          </div>
        </>
      )}

      {/* Positivo */}
      {breakdown.positivo.length > 0 && (
        <>
          <SectionHeader title="Positivo" unit={breakdown.perUnit} />
          <div>
            {breakdown.positivo.map((row) => (
              <NutrientRow key={row.key} row={row} />
            ))}
          </div>
        </>
      )}

      {/* Diferenciador de Sumi: propone que hacer */}
      {evaluation.level !== "excelente" && (
        <div className="mt-6 rounded-2xl border border-sumi/30 bg-sumi-light/10 p-4">
          <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-sumi-dark">
            <Lightbulb size={16} />
            Mejor que esto
          </h3>
          <p className="text-sm text-slate-700">
            Mira la pestaña <span className="font-semibold">Alternativas</span> para
            ver una opción más saludable, del mismo tipo y disponible en el Perú.
          </p>
        </div>
      )}
    </div>
  );
}
