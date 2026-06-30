import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { SWRegister } from "@/components/SWRegister";

export const metadata: Metadata = {
  title: "Hábitos — Construye tu racha",
  description: "Un hábito a la vez. Marca, mantén tu racha, repite.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Hábitos",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0066FF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="grain antialiased">
        <main className="relative z-10">{children}</main>
        <SWRegister />
      </body>
    </html>
  );
}
