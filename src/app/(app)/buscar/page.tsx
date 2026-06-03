"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { LEVEL_META, UNKNOWN_COLOR } from "@/lib/format";
import type { GradeLevel } from "@/lib/types";

interface Result {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  score: number | null;
  level: GradeLevel | null;
}

export default function BuscarPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setTouched(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Búsqueda</h1>

      <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 focus-within:border-sumi">
        <Search size={18} className="text-slate-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca un producto por nombre"
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      {loading && <p className="text-center text-sm text-slate-500">Buscando…</p>}

      {!loading && touched && results.length === 0 && q.trim().length >= 2 && (
        <p className="py-10 text-center text-sm text-slate-400">
          Sin resultados. Escanéalo para agregarlo a Sumi.
        </p>
      )}

      <ul className="divide-y divide-slate-100">
        {results.map((r) => (
          <li key={r.barcode}>
           <Link
             href={`/producto/${r.barcode}`}
             className="flex items-center gap-3 py-3"
           >
            {r.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.imageUrl} alt="" className="h-12 w-12 rounded-lg object-contain" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-slate-100" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{r.name}</p>
              {r.brand && <p className="truncate text-xs text-slate-500">{r.brand}</p>}
            </div>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{
                backgroundColor: r.level ? LEVEL_META[r.level].color : UNKNOWN_COLOR,
              }}
            >
              {r.score ?? "?"}
            </span>
            <ChevronRight size={18} className="text-slate-300" />
           </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
