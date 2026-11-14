/**
 * Cookie de sesión firmada con HMAC-SHA256 (Web Crypto, vale en Edge y Node).
 * Sin dependencias ni proveedor externo: el usuario vive en la propia base.
 */

export const SESSION_COOKIE = "ff_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

interface SessionPayload {
  userId: string;
  exp: number;
}

function secretKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("Falta AUTH_SECRET en .env (mínimo 16 caracteres)");
  }
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function signSession(userId: string): Promise<{
  value: string;
  maxAge: number;
}> {
  const payload: SessionPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await secretKey(),
    new TextEncoder().encode(body),
  );
  return {
    value: `${body}.${toBase64Url(new Uint8Array(signature))}`,
    maxAge: MAX_AGE_SECONDS,
  };
}

/** Devuelve el userId solo si la firma es válida y no caducó. */
export async function verifySession(
  cookieValue: string | undefined,
): Promise<string | null> {
  if (!cookieValue) return null;
  const [body, signature] = cookieValue.split(".");
  if (!body || !signature) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await secretKey(),
      fromBase64Url(signature),
      new TextEncoder().encode(body),
    );
    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as SessionPayload;
    if (!payload.userId || payload.exp * 1000 < Date.now()) return null;
    return payload.userId;
  } catch {
    return null;
  }
}
