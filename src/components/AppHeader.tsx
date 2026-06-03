"use client";

import Link from "next/link";
import { Sprout, CircleUserRound } from "lucide-react";

/** Encabezado fijo: marca Sumi (icono flat) + acceso a la Cuenta. */
export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-20 bg-sumi text-white pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Link href="/escanear" className="flex items-center gap-2">
          <Sprout size={22} strokeWidth={2} />
          <span className="text-lg font-bold leading-none">Sumi</span>
        </Link>
        <Link href="/cuenta" aria-label="Cuenta">
          <CircleUserRound size={26} strokeWidth={1.8} />
        </Link>
      </div>
    </header>
  );
}
