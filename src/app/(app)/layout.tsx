import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

/** Shell de la app: encabezado fijo arriba, navegación de pestañas abajo. */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-[68px]">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
