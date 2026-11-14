import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import PenaltyGame from "./PenaltyGame";

export const metadata: Metadata = {
  title: "Tanda de penales — Full Fútbol",
  description:
    "Mientras esperas el partido: patea, ataja y gana la tanda de penales.",
};

export default function PenalesPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-6">
      <header className="mb-5 text-center">
        <Link href="/">
          <Logo className="justify-center text-xl text-neutral-400" />
        </Link>
        <h1 className="ff-wordmark mt-3 text-3xl">Tanda de penales</h1>
        <p className="text-sm text-neutral-400">
          Cinco penales pateando y cinco atajando. A ver si ganas.
        </p>
      </header>

      <PenaltyGame />

      <footer className="mt-8 text-center text-xs text-neutral-600">
        <Link href="/" className="underline">
          Volver a los torneos
        </Link>
      </footer>
    </main>
  );
}
