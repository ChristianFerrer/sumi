"use client";

import { useState } from "react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ProductResult } from "@/components/ProductResult";
import { PhotoContribution } from "@/components/PhotoContribution";
import type { Product, SumiEvaluation } from "@/lib/types";

type State =
  | { status: "idle" }
  | { status: "loading"; barcode: string }
  | { status: "found"; product: Product; evaluation: SumiEvaluation }
  | { status: "not-found"; barcode: string }
  | { status: "error"; message: string };

export default function Home() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function lookup(barcode: string) {
    setState({ status: "loading", barcode });
    try {
      const res = await fetch(`/api/producto/${barcode}`);
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Error" });
      } else if (data.found) {
        setState({ status: "found", product: data.product, evaluation: data.evaluation });
      } else {
        setState({ status: "not-found", barcode });
      }
    } catch {
      setState({ status: "error", message: "Sin conexion. Intenta de nuevo." });
    }
  }

  return (
    <div className="space-y-5">
      {state.status === "idle" && (
        <>
          <p className="text-center text-sm text-slate-600">
            Escanea un producto y descubre que tan bueno es para ti — y que
            comer en su lugar.
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
          <div className="text-5xl">🔍</div>
          <h2 className="font-bold">Aun no tenemos este producto</h2>
          <p className="text-sm text-slate-600">
            Codigo {state.barcode}. Ayuda a la comunidad Sumi: toma una foto de
            la tabla nutricional y la IA la leera por ti.
          </p>
          <PhotoContribution
            barcode={state.barcode}
            onResult={(product, evaluation) =>
              setState({ status: "found", product, evaluation })
            }
          />
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
