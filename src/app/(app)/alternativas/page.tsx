"use client";

import { useEffect, useState } from "react";
import { X, Check, ChevronRight, ArrowLeftRight } from "lucide-react";
import { getHistory, type HistoryEntry } from "@/lib/history";
import { LEVEL_META } from "@/lib/format";
import type { GradeLevel } from "@/lib/types";

interface Alternative {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  score: number | null;
  level: GradeLevel | null;
}

interface Pair {
  scanned: HistoryEntry;
  better: Alternative;
}

function Thumb({ src }: { src?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-28 w-full rounded-lg object-contain" />
  ) : (
    <div className="h-28 w-full rounded-lg bg-slate-100" />
  );
}

function Card({
  entry,
  good,
}: {
  entry: { name: string; brand?: string; imageUrl?: string; level: GradeLevel | null };
  good: boolean;
}) {
  return (
    <div className="relative flex-1">
      <span
        className={`absolute -left-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full text-white ${
          good ? "bg-grade-excellent" : "bg-grade-bad"
        }`}
      >
        {good ? <Check size={16} /> : <X size={16} />}
      </span>
      <Thumb src={entry.imageUrl} />
      <p className="mt-1 truncate text-center text-sm font-semibold">{entry.name}</p>
      {entry.brand && (
        <p className="truncate text-center text-xs text-slate-500">{entry.brand}</p>
      )}
      {entry.level && (
        <p
          className="mt-0.5 flex items-center justify-center gap-1 text-xs"
          style={{ color: LEVEL_META[entry.level].color }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: LEVEL_META[entry.level].color }}
          />
          {LEVEL_META[entry.level].label}
        </p>
      )}
    </div>
  );
}

export default function AlternativasPage() {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const candidates = getHistory()
        .filter((e) => e.level && e.level !== "excelente")
        .slice(0, 12);

      const found: Pair[] = [];
      for (const scanned of candidates) {
        try {
          const params = new URLSearchParams({
            kind: scanned.kind,
            exclude: scanned.barcode,
            minScore: String(scanned.score ?? 0),
          });
          const res = await fetch(`/api/alternativas?${params}`);
          const data = await res.json();
          if (data.alternative) found.push({ scanned, better: data.alternative });
        } catch {
          // ignora fallos puntuales
        }
      }
      if (!cancelled) {
        setPairs(found);
        setLoading(false);
      }
    }
    load();
    window.addEventListener("sumi:historial-cambio", load);
    return () => {
      cancelled = true;
      window.removeEventListener("sumi:historial-cambio", load);
    };
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Alternativas</h1>

      {loading ? (
        <p className="py-10 text-center text-slate-500">Buscando mejores opciones…</p>
      ) : pairs.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <ArrowLeftRight size={48} strokeWidth={1.5} className="mx-auto mb-3" />
          <p className="text-sm">Escanea productos para ver alternativas más sanas.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {pairs.map(({ scanned, better }) => (
            <li
              key={scanned.barcode}
              className="rounded-2xl bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Card entry={scanned} good={false} />
                <ChevronRight size={20} className="shrink-0 text-slate-300" />
                <Card entry={better} good />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
