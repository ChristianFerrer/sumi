"use client";

import { useEffect, useMemo, useState } from "react";
import { getSynthesis, type Synthesis } from "@/lib/history";
import { LEVEL_META, UNKNOWN_COLOR } from "@/lib/format";
import type { GradeLevel } from "@/lib/types";

const LEVELS: GradeLevel[] = ["excelente", "bueno", "mediocre", "malo"];

function PieChart({ data }: { data: Synthesis }) {
  const segments = [
    { value: data.excelente, color: LEVEL_META.excelente.color },
    { value: data.bueno, color: LEVEL_META.bueno.color },
    { value: data.mediocre, color: LEVEL_META.mediocre.color },
    { value: data.malo, color: LEVEL_META.malo.color },
  ].filter((s) => s.value > 0);

  const total = segments.reduce((a, s) => a + s.value, 0);
  const R = 70;
  const C = 2 * Math.PI * R;

  if (total === 0) {
    return (
      <svg viewBox="0 0 180 180" className="mx-auto h-44 w-44">
        <circle cx="90" cy="90" r={R} fill="none" stroke="#e2e8f0" strokeWidth="36" />
      </svg>
    );
  }

  let offset = 0;
  return (
    <svg viewBox="0 0 180 180" className="mx-auto h-44 w-44 -rotate-90">
      {segments.map((s, i) => {
        const len = (s.value / total) * C;
        const el = (
          <circle
            key={i}
            cx="90"
            cy="90"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="36"
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-offset}
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

export default function SintesisPage() {
  const [kind, setKind] = useState<"food" | "cosmetic">("food");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    window.addEventListener("sumi:historial-cambio", refresh);
    return () => window.removeEventListener("sumi:historial-cambio", refresh);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => getSynthesis(kind), [kind, tick]);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Mi alimentación</h1>

      <PieChart data={data} />

      <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        {(["food", "cosmetic"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`flex-1 rounded-lg py-2 ${
              kind === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            {k === "food" ? "Alimentos" : "Cosméticos"}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Síntesis
        </p>
        <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {LEVELS.map((lvl) => (
            <li
              key={lvl}
              className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0"
            >
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: LEVEL_META[lvl].color }}
              />
              <span className="flex-1 font-medium">{LEVEL_META[lvl].label}</span>
              <span className="text-slate-500">{data[lvl]}</span>
            </li>
          ))}
        </ul>
        {data.desconocido > 0 && (
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: UNKNOWN_COLOR }}
            />
            {data.desconocido} producto{data.desconocido === 1 ? "" : "s"} desconocido
            {data.desconocido === 1 ? "" : "s"}
          </p>
        )}
      </div>
    </div>
  );
}
