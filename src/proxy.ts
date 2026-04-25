import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/jwt";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup"]);

function isRotaPublicaCliente(pathname: string) {
  if (!pathname.startsWith("/c/")) return false;
  const partes = pathname.split("/").filter(Boolean);
  if (partes.length === 2) return true;
  if (partes.length === 3 && (partes[2] === "login" || partes[2] === "cadastro")) {
    return true;
  }
  return false;
}

const COOKIE_STAFF =
  process.env.AUTH_COOKIE_NAME ?? "barbearia_staff_session";
const COOKIE_CLIENTE =
  process.env.AUTH_COOKIE_CLIENTE ?? "barbearia_cliente_session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const tokenStaff = request.cookies.get(COOKIE_STAFF)?.value;
  const tokenCliente = request.cookies.get(COOKIE_CLIENTE)?.value;
  const sessionStaff = tokenStaff ? await verifySession(tokenStaff) : null;
  const sessionCliente = tokenCliente ? await verifySession(tokenCliente) : null;

  const isPublic = PUBLIC_PATHS.has(pathname) || isRotaPublicaCliente(pathname);

  // Rotas de staff (dashboard, agenda, etc)
  const isStaffRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/agenda") ||
    pathname.startsWith("/clientes") ||
    pathname.startsWith("/equipe") ||
    pathname.startsWith("/servicos") ||
    pathname.startsWith("/produtos") ||
    pathname.startsWith("/financeiro") ||
    pathname.startsWith("/config");

  const isPortalRoute = pathname.startsWith("/c/");

  // Staff precisa de sessão staff
  if (isStaffRoute && (!sessionStaff || sessionStaff.tipo !== "equipe")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Portal (rotas logadas) precisa de sessão cliente
  if (
    isPortalRoute &&
    !isPublic &&
    (!sessionCliente || sessionCliente.tipo !== "cliente")
  ) {
    const slug = pathname.split("/")[2];
    return NextResponse.redirect(new URL(`/c/${slug}/login`, request.url));
  }

  // Já logado como staff visitando /login ou /signup → /dashboard
  if (sessionStaff && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)",
  ],
};
