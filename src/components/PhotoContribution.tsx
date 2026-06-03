"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import type { Product, SumiEvaluation } from "@/lib/types";

/**
 * Flujo colaborativo: el usuario fotografia la tabla nutricional de un producto
 * que no estaba en la base, y la IA la lee. Asi cada escaneo hace crecer Sumi.
 */
export function PhotoContribution({
  barcode,
  onResult,
}: {
  barcode: string;
  onResult: (product: Product, evaluation: SumiEvaluation) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "reading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(file: File) {
    setStatus("reading");
    setMessage(null);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    try {
      const res = await fetch("/api/aportar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode, image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "No se pudo procesar la foto.");
      } else if (!data.readable) {
        setStatus("error");
        setMessage(data.message ?? "No pudimos leer la etiqueta.");
      } else {
        onResult(data.product, data.evaluation);
      }
    } catch {
      setStatus("error");
      setMessage("Sin conexion. Intenta de nuevo.");
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={status === "reading"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sumi px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Camera size={18} />
        {status === "reading" ? "Leyendo etiqueta con IA…" : "Fotografiar la tabla nutricional"}
      </button>
      {message && <p className="text-sm text-grade-bad">{message}</p>}
    </div>
  );
}
