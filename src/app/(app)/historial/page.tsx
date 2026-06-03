"use client";

import { useEffect, useState } from "react";
import { Trash2, ChevronRight, Clock } from "lucide-react";
import {
  clearHistory,
  getHistory,
  type HistoryEntry,
} from "@/lib/history";
import { LEVEL_META, UNKNOWN_COLOR, relativeTime } from "@/lib/format";

export default function HistorialPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const refresh = () => setEntries(getHistory());
    refresh();
    window.addEventListener("sumi:historial-cambio", refresh);
    return () => window.removeEventListener("sumi:historial-cambio", refresh);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Historial</h1>
        {entries.length > 0 && (
          <button
            onClick={() => {
              if (confirm("¿Vaciar el historial?")) clearHistory();
            }}
            aria-label="Vaciar historial"
            className="text-sumi"
          >
            <Trash2 size={22} />
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y divide-slate-100">
          {entries.map((e) => (
            <li key={e.barcode} className="flex items-center gap-3 py-3">
              {e.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={e.imageUrl}
                  alt=""
                  className="h-14 w-14 rounded-lg object-contain"
                />
              ) : (
                <div className="h-14 w-14 rounded-lg bg-slate-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.name}</p>
                {e.brand && (
                  <p className="truncate text-xs text-slate-500">{e.brand}</p>
                )}
                <div className="mt-1 flex items-center gap-1.5 text-sm">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: e.level
                        ? LEVEL_META[e.level].color
                        : UNKNOWN_COLOR,
                    }}
                  />
                  <span className="text-slate-600">
                    {e.level ? LEVEL_META[e.level].label : "Desconocido"}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={12} />
                  {relativeTime(e.scannedAt)}
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center text-slate-400">
      <Clock size={48} strokeWidth={1.5} className="mx-auto mb-3" />
      <p className="text-sm">Aún no escaneas productos.</p>
      <p className="text-sm">Tu historial aparecerá aquí.</p>
    </div>
  );
}
