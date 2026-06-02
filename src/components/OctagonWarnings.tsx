import type { Octogono } from "@/lib/types";

/** Renderiza los octogonos de advertencia al estilo oficial peruano (negros). */
export function OctagonWarnings({ octogonos }: { octogonos: Octogono[] }) {
  if (octogonos.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {octogonos.map((o) => (
        <div
          key={o.nutrient}
          className="flex items-center justify-center bg-black px-3 py-2 text-center text-[10px] font-extrabold uppercase leading-tight text-white"
          style={{
            clipPath:
              "polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)",
            minWidth: "88px",
            minHeight: "88px",
          }}
        >
          {o.label}
        </div>
      ))}
    </div>
  );
}
