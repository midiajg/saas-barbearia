import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { isStaff, signSession, verifySession, type SessionPayload } from "./jwt";

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

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Exige sessão de staff (owner | manager | barber) e retorna o orgId.
 * Bloqueia super_admin sem ?org_id e clientes.
 */
export async function requireStaffSession() {
  const session = await requireSession();
  if (!isStaff(session)) {
    redirect("/login");
  }
  return session;
}

export async function requireOwnerOrManager() {
  const s = await requireStaffSession();
  if (s.role !== "owner" && s.role !== "manager") {
    redirect("/dashboard");
  }
  return s;
}

export async function requireClienteSession(slug: string) {
  const session = await getSession();
  if (!session || session.persona !== "client") {
    redirect(`/c/${slug}/login`);
  }
  return session;
}
