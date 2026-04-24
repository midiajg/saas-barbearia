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

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(env.AUTH_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(env.AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

// ---- Staff / equipe ----

export async function requireSession(): Promise<SessionEquipe> {
  const session = await getSession();
  if (!session || session.tipo !== "equipe") redirect("/login");
  return session as SessionEquipe;
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
  const session = await getSession();
  if (!session || session.tipo !== "cliente") {
    redirect(`/c/${slug}/login`);
  }
  return session as SessionCliente;
}
