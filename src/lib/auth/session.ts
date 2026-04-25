import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import {
  signSession,
  verifySession,
  type SessionCliente,
  type SessionEquipe,
  type SessionPayload,
} from "./jwt";

const MAX_AGE = 60 * 60 * 24 * 30;

function cookieName(tipo: "equipe" | "cliente"): string {
  return tipo === "equipe" ? env.AUTH_COOKIE_NAME : env.AUTH_COOKIE_CLIENTE;
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(cookieName(payload.tipo), token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySessionEquipe(): Promise<void> {
  const store = await cookies();
  store.delete(env.AUTH_COOKIE_NAME);
}

export async function destroySessionCliente(): Promise<void> {
  const store = await cookies();
  store.delete(env.AUTH_COOKIE_CLIENTE);
}

export async function destroySession(): Promise<void> {
  // Remove os 2 (logout total)
  await destroySessionEquipe();
  await destroySessionCliente();
}

export async function getSessionEquipe(): Promise<SessionEquipe | null> {
  const store = await cookies();
  const token = store.get(env.AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const s = await verifySession(token);
  return s?.tipo === "equipe" ? s : null;
}

export async function getSessionCliente(): Promise<SessionCliente | null> {
  const store = await cookies();
  const token = store.get(env.AUTH_COOKIE_CLIENTE)?.value;
  if (!token) return null;
  const s = await verifySession(token);
  return s?.tipo === "cliente" ? s : null;
}

/**
 * Pega a sessão de qualquer tipo. Útil pra decidir o que fazer em rotas
 * que ambos podem acessar (ex: home).
 */
export async function getSession(): Promise<SessionPayload | null> {
  const equipe = await getSessionEquipe();
  if (equipe) return equipe;
  return getSessionCliente();
}

// ---- Staff / equipe ----

export async function requireSession(): Promise<SessionEquipe> {
  const session = await getSessionEquipe();
  if (!session) redirect("/login");
  return session;
}

export async function requireDonoOuGerente(): Promise<SessionEquipe> {
  const s = await requireSession();
  if (s.cargo !== "dono" && s.cargo !== "gerente") {
    redirect("/dashboard");
  }
  return s;
}

export async function requireDono(): Promise<SessionEquipe> {
  const s = await requireSession();
  if (s.cargo !== "dono") redirect("/dashboard");
  return s;
}

// ---- Cliente (portal público) ----

export async function requireClienteSession(
  slug: string
): Promise<SessionCliente> {
  const session = await getSessionCliente();
  if (!session) redirect(`/c/${slug}/login`);
  return session;
}
