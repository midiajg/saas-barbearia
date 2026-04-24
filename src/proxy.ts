import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/jwt";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(
    process.env.AUTH_COOKIE_NAME ?? "barbearia_session"
  )?.value;
  const session = token ? await verifySession(token) : null;

  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!session && !isPublic) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (session && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)",
  ],
};
