"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ProductResult } from "@/components/ProductResult";
import { PhotoContribution } from "@/components/PhotoContribution";
import { recordScan, recordUnknown } from "@/lib/history";
import type { Product, SumiEvaluation } from "@/lib/types";

type State =
  | { status: "idle" }
  | { status: "loading"; barcode: string }
  | { status: "found"; product: Product; evaluation: SumiEvaluation }
  | { status: "not-found"; barcode: string }
  | { status: "error"; message: string };

export default function EscanearPage() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function lookup(barcode: string) {
    setState({ status: "loading", barcode });
    try {
      const res = await fetch(`/api/producto/${barcode}`);
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Error" });
      } else if (data.found) {
        recordScan(data.product, data.evaluation);
        setState({ status: "found", product: data.product, evaluation: data.evaluation });
      } else {
        recordUnknown(barcode);
        setState({ status: "not-found", barcode });
      }
    } catch {
      setState({ status: "error", message: "Sin conexión. Intenta de nuevo." });
    }
  }

  function showResult(product: Product, evaluation: SumiEvaluation) {
    recordScan(product, evaluation);
    setState({ status: "found", product, evaluation });
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Escanear</h1>

      {state.status === "idle" && (
        <>
          <p className="text-sm text-slate-600">
            Escanea un producto y descubre qué tan bueno es para ti — y qué
            consumir en su lugar.
          </p>
          <BarcodeScanner onDetected={lookup} />
        </>
      )}

      {state.status === "loading" && (
        <p className="py-10 text-center text-slate-500">
          Analizando {state.barcode}…
        </p>
      )}

      {state.status === "found" && (
        <>
          <ProductResult product={state.product} evaluation={state.evaluation} />
          <ResetButton onReset={() => setState({ status: "idle" })} />
        </>
      )}

      {state.status === "not-found" && (
        <div className="space-y-4 text-center">
          <div className="flex justify-center text-slate-300">
            <Search size={56} strokeWidth={1.5} />
          </div>
          <h2 className="font-bold">Aún no tenemos este producto</h2>
          <p className="text-sm text-slate-600">
            Código {state.barcode}. Ayuda a la comunidad Sumi: toma una foto de
            la tabla nutricional y la IA la leerá por ti.
          </p>
          <PhotoContribution barcode={state.barcode} onResult={showResult} />
          <ResetButton onReset={() => setState({ status: "idle" })} />
        </div>
      )}

      {state.status === "error" && (
        <div className="space-y-4 text-center">
          <p className="text-grade-bad">{state.message}</p>
          <ResetButton onReset={() => setState({ status: "idle" })} />
        </div>
      )}
    </div>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button
      onClick={onReset}
      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
    >
      Escanear otro producto
    </button>
  );
}
