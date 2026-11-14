import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/** Corta el paso al panel sin sesión válida; las páginas públicas no pasan por aquí. */
export async function middleware(request: NextRequest) {
  const userId = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (userId) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
