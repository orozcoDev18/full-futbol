"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, signSession } from "@/lib/session";

export async function login(_prev: string | null, formData: FormData) {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) return "Completa usuario y contraseña.";

  const user = await prisma.user.findUnique({ where: { username } });
  // Mismo mensaje para usuario inexistente y contraseña mala: no filtramos cuál falló.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return "Usuario o contraseña incorrectos.";
  }

  const session = await signSession(user.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, session.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.maxAge,
  });

  redirect("/dashboard");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
