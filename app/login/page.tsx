"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Logo } from "@/components/Logo";
import { login } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export default function LoginPage() {
  const [error, formAction] = useActionState(login, null);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <Logo className="justify-center text-4xl" />
        <p className="mt-2 text-sm text-neutral-400">
          Panel del organizador
        </p>
      </div>

      <form action={formAction} className="card space-y-4">
        <div>
          <label className="label" htmlFor="username">
            Usuario
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            required
            className="w-full"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        <SubmitButton />
      </form>

      <Link
        href="/"
        className="mt-6 text-center text-sm text-neutral-400 underline"
      >
        Ver torneos y noticias sin iniciar sesión
      </Link>
    </main>
  );
}
