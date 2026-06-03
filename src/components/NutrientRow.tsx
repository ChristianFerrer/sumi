"use client";

import { useState } from "react";
import {
  FlaskConical,
  Flame,
  Box,
  Droplet,
  Soup,
  Apple,
  Wheat,
  Fish,
  ChevronDown,
  ChevronUp,
  Info,
  type LucideIcon,
} from "lucide-react";
import type { BreakdownRow } from "@/lib/breakdown";

const ICONS: Record<string, LucideIcon> = {
  additives: FlaskConical,
  energy: Flame,
  sugar: Box,
  satfat: Droplet,
  sodium: Soup,
  fruits: Apple,
  fiber: Wheat,
  proteins: Fish,
};

function Scale({
  marks,
  colors,
  markerPct,
}: {
  marks: number[];
  colors: string[];
  markerPct: number;
}) {
  return (
    <div className="pt-2">
      {/* marcador */}
      <div className="relative h-2">
        <div
          className="absolute -translate-x-1/2"
          style={{ left: `${markerPct}%` }}
        >
          <div
            className="mx-auto h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent"
            style={{ borderTopColor: "#334155" }}
          />
        </div>
      </div>
      {/* barra de zonas */}
      <div className="flex h-2 overflow-hidden rounded-full">
        {colors.map((c, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>
      {/* marcas */}
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        {marks.map((m, i) => (
          <span key={i}>
            {m}
            {i === marks.length - 1 ? "+" : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export function NutrientRow({ row }: { row: BreakdownRow }) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[row.iconKey] ?? Box;
  const expandable = Boolean(row.scale || row.additives);

  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <button
        onClick={() => expandable && setOpen((o) => !o)}
        className="flex w-full items-center gap-3 text-left"
      >
        <Icon size={26} strokeWidth={1.6} className="shrink-0 text-slate-500" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">{row.title}</p>
          <p className="text-sm text-slate-500">{row.qualifier}</p>
        </div>
        <span className="font-semibold text-slate-700">{row.valueLabel}</span>
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: row.dotColor }}
        />
        {expandable &&
          (open ? (
            <ChevronUp size={18} className="shrink-0 text-slate-400" />
          ) : (
            <ChevronDown size={18} className="shrink-0 text-slate-400" />
          ))}
      </button>

      {open && row.additives && (
        <div className="mt-3 space-y-2 pl-9">
          {row.additives.length === 0 ? (
            <p className="text-sm text-slate-500">Este producto no tiene aditivos.</p>
          ) : (
            row.additives.map((a) => (
              <div key={a.code} className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: a.color }}
                />
                <span className="font-medium">{a.code}</span>
              </div>
            ))
          )}
          <a
            href="https://world.openfoodfacts.org/additives"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 pt-1 text-sm font-medium text-sumi"
          >
            <Info size={15} />
            Más info sobre los aditivos
          </a>
        </div>
      )}

      {open && row.scale && (
        <div className="pl-9">
          <Scale
            marks={row.scale.marks}
            colors={row.scale.colors}
            markerPct={row.scale.markerPct}
          />
        </div>
      )}
    </div>
  );
}
