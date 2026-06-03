"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { ScanLine } from "lucide-react";

/**
 * Escaner de codigo de barras en el navegador (sin app store, fiel al "tipo PWA").
 * Usa la camara via ZXing. Incluye entrada manual como respaldo, util en
 * desktop o cuando no hay permiso de camara.
 */
export function BarcodeScanner({
  onDetected,
}: {
  onDetected: (barcode: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!scanning) return;
    const reader = new BrowserMultiFormatReader();
    let stop: (() => void) | undefined;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, _err, controls) => {
        stop = () => controls.stop();
        if (result) {
          controls.stop();
          setScanning(false);
          onDetected(result.getText());
        }
      })
      .catch(() => {
        setError("No se pudo acceder a la camara. Ingresa el codigo a mano.");
        setScanning(false);
      });

    return () => stop?.();
  }, [scanning, onDetected]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-black">
        {scanning ? (
          <video ref={videoRef} className="aspect-square w-full object-cover" />
        ) : (
          <button
            onClick={() => {
              setError(null);
              setScanning(true);
            }}
            className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-sumi text-white"
          >
            <ScanLine size={56} strokeWidth={1.5} />
            <span className="font-semibold">Escanear código de barras</span>
          </button>
        )}
      </div>

      {error && <p className="text-sm text-grade-bad">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const code = manual.trim();
          if (/^\d{8,14}$/.test(code)) onDetected(code);
          else setError("Ingresa un codigo de barras valido (8 a 14 digitos).");
        }}
        className="flex gap-2"
      >
        <input
          inputMode="numeric"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="o ingresa el codigo a mano"
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-xl bg-sumi px-4 py-2 text-sm font-semibold text-white"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}
