import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sumi — escanea, entiende, mejora",
  description:
    "La app peruana que te dice si un producto es bueno para ti y te propone mejores alternativas. Inspirada en Yuka.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-PE">
      <body className="min-h-screen">
        <header className="bg-sumi text-white">
          <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
            <span className="text-2xl">🌱</span>
            <div>
              <h1 className="text-lg font-bold leading-none">Sumi</h1>
              <p className="text-[11px] text-sumi-light">
                escanea · entiende · mejora
              </p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-md px-4 py-5">{children}</main>
      </body>
    </html>
  );
}
