import type { GradeLevel } from "@/lib/types";

const STYLE: Record<GradeLevel, { bg: string; label: string }> = {
  excelente: { bg: "bg-grade-excellent", label: "Excelente" },
  bueno: { bg: "bg-grade-good", label: "Bueno" },
  mediocre: { bg: "bg-grade-poor", label: "Mediocre" },
  malo: { bg: "bg-grade-bad", label: "Malo" },
};

export function ScoreBadge({
  score,
  level,
}: {
  score: number;
  level: GradeLevel;
}) {
  const s = STYLE[level];
  return (
    <div className={`flex items-center gap-3 rounded-2xl ${s.bg} px-4 py-3 text-white`}>
      <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white/20">
        <span className="text-2xl font-extrabold leading-none">{score}</span>
        <span className="text-[10px] opacity-80">/ 100</span>
      </div>
      <div>
        <p className="text-xl font-bold">{s.label}</p>
        <p className="text-xs opacity-90">Nota Sumi</p>
      </div>
    </div>
  );
}
