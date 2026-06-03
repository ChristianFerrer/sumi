"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, ArrowLeftRight, ScanLine, PieChart, Search } from "lucide-react";

const TABS = [
  { href: "/historial", label: "Historial", Icon: Clock },
  { href: "/alternativas", label: "Alternativas", Icon: ArrowLeftRight },
  { href: "/escanear", label: "Escanear", Icon: ScanLine },
  { href: "/sintesis", label: "Síntesis", Icon: PieChart },
  { href: "/buscar", label: "Búsqueda", Icon: Search },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] ${
                  active ? "text-sumi" : "text-slate-400"
                }`}
              >
                <Icon size={24} strokeWidth={active ? 2.4 : 1.8} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
