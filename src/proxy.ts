import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/jwt";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup"]);

function isRotaPublicaCliente(pathname: string) {
  // /c/[slug], /c/[slug]/login, /c/[slug]/cadastro são públicas
  if (!pathname.startsWith("/c/")) return false;
  const partes = pathname.split("/").filter(Boolean); // ["c", slug, ...]
  if (partes.length === 2) return true;
  if (partes.length === 3 && (partes[2] === "login" || partes[2] === "cadastro")) {
    return true;
  }
  return false;
}

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

  const isPublic = PUBLIC_PATHS.has(pathname) || isRotaPublicaCliente(pathname);

  if (!session && !isPublic) {
    // Rotas /c/[slug]/* logadas redirecionam pro login da barbearia
    if (pathname.startsWith("/c/")) {
      const slug = pathname.split("/")[2];
      return NextResponse.redirect(new URL(`/c/${slug}/login`, request.url));
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Sessão de equipe tentando acessar /login ou /signup → manda pro dashboard
  if (
    session &&
    session.tipo === "equipe" &&
    (pathname === "/login" || pathname === "/signup")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Sessão de cliente tentando acessar rota de staff → bloqueia
  if (
    session &&
    session.tipo === "cliente" &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/agenda") ||
      pathname.startsWith("/clientes") ||
      pathname.startsWith("/equipe") ||
      pathname.startsWith("/servicos") ||
      pathname.startsWith("/produtos") ||
      pathname.startsWith("/financeiro") ||
      pathname.startsWith("/config"))
  ) {
    return NextResponse.redirect(new URL(`/c/${session.barbeariaSlug}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)",
  ],
};
