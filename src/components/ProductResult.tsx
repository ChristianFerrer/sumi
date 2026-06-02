import type { Product, SumiEvaluation } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";
import { OctagonWarnings } from "./OctagonWarnings";

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-semibold">{value}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-sumi"
          style={{ width: `${value}%` }}
        />
      </div>
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
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-16 w-16 rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-2xl">
            🛒
          </div>
        )}
        <div>
          <h2 className="font-bold leading-tight">{product.name}</h2>
          {product.brand && (
            <p className="text-xs text-slate-500">{product.brand}</p>
          )}
        </div>
      </div>

      <ScoreBadge score={evaluation.score} level={evaluation.level} />

      <OctagonWarnings octogonos={evaluation.octogonos} />

      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <Bar label="Calidad nutricional (60%)" value={evaluation.breakdown.nutrition} />
        <Bar label="Aditivos (30%)" value={evaluation.breakdown.additives} />
        <Bar label="Procesamiento (10%)" value={evaluation.breakdown.processing} />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold">Por que esta nota</h3>
        <ul className="space-y-1 text-sm text-slate-700">
          {evaluation.reasons.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-sumi">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Diferenciador de Sumi: no solo advierte, propone que hacer. */}
      {evaluation.level !== "excelente" && (
        <div className="rounded-2xl border border-sumi/30 bg-sumi-light/10 p-4">
          <h3 className="mb-1 text-sm font-semibold text-sumi-dark">
            💡 Mejor que esto
          </h3>
          <p className="text-sm text-slate-700">
            Pronto Sumi te recomendara una alternativa mas saludable, del mismo
            tipo y rango de precio, disponible en el Peru.{" "}
            <span className="text-slate-400">(motor de alternativas — V2)</span>
          </p>
        </div>
      )}
    </div>
  );
}
