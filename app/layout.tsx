import type { Metadata, Viewport } from "next";
import { Bebas_Neue } from "next/font/google";
import { PitchBackground } from "@/components/PitchBackground";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Full Fútbol",
  description: "Gestión de torneos de fútbol amateur",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#064e2a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={display.variable}>
      <body className="min-h-dvh">
        <PitchBackground />
        {children}
      </body>
    </html>
  );
}
