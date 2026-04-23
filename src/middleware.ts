import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/jwt";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/admin/login",
  "/api/auth/login",
  "/api/auth/signup",
]);

function isPublicClienteRoute(pathname: string) {
  // /c/[slug], /c/[slug]/login, /c/[slug]/signup são públicos
  if (!pathname.startsWith("/c/")) return false;
  const partes = pathname.split("/").filter(Boolean); // ['c', 'slug', ...]
  if (partes.length === 2) return true;
  if (partes.length === 3 && (partes[2] === "login" || partes[2] === "signup")) {
    return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
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

  const isPublic = PUBLIC_PATHS.has(pathname) || isPublicClienteRoute(pathname);

  if (!session && !isPublic) {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (pathname.startsWith("/c/")) {
      const slug = pathname.split("/")[2];
      return NextResponse.redirect(new URL(`/c/${slug}/login`, request.url));
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Roteia já-logado pra área correta
  if (session) {
    if ((pathname === "/login" || pathname === "/signup") && session.persona !== "client") {
      const dest =
        session.persona === "super_admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    // Bloqueia client em rotas de staff
    if (
      session.persona === "client" &&
      (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/agenda") ||
        pathname.startsWith("/clientes") ||
        pathname.startsWith("/barbeiros") ||
        pathname.startsWith("/servicos") ||
        pathname.startsWith("/produtos") ||
        pathname.startsWith("/financeiro") ||
        pathname.startsWith("/config"))
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Bloqueia staff em /admin (só super_admin acessa)
    if (pathname.startsWith("/admin") && session.persona !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const response = NextResponse.next();
  if (session) {
    response.headers.set("x-persona", session.persona);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)",
  ],
};
