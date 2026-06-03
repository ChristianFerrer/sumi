"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Search } from "lucide-react";
import { ProductResult } from "@/components/ProductResult";
import type { Product, SumiEvaluation } from "@/lib/types";

type State =
  | { status: "loading" }
  | { status: "found"; product: Product; evaluation: SumiEvaluation }
  | { status: "not-found" }
  | { status: "error"; message: string };

export default function ProductoPage() {
  const params = useParams<{ barcode: string }>();
  const router = useRouter();
  const barcode = params.barcode;
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/producto/${barcode}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) setState({ status: "error", message: data.error ?? "Error" });
        else if (data.found)
          setState({ status: "found", product: data.product, evaluation: data.evaluation });
        else setState({ status: "not-found" });
      } catch {
        if (!cancelled) setState({ status: "error", message: "Sin conexión." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [barcode]);

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sumi"
      >
        <ChevronLeft size={20} />
        <span className="font-medium">Volver</span>
      </button>

      {state.status === "loading" && (
        <p className="py-10 text-center text-slate-500">Cargando producto…</p>
      )}

      {state.status === "found" && (
        <ProductResult product={state.product} evaluation={state.evaluation} />
      )}

      {state.status === "not-found" && (
        <div className="space-y-3 py-12 text-center text-slate-400">
          <Search size={48} strokeWidth={1.5} className="mx-auto" />
          <p className="text-sm">No tenemos los datos de este producto todavía.</p>
        </div>
      )}

      {state.status === "error" && (
        <p className="py-12 text-center text-grade-bad">{state.message}</p>
      )}
    </div>
  );
}
