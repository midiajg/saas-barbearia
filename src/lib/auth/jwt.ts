import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import type { Persona, UserRole } from "@/infrastructure/database/types";

const secret = new TextEncoder().encode(env.AUTH_SECRET);
const ISSUER = "barbearia-sistema";

export type SessionPayload =
  | {
      persona: "super_admin";
      userId: string;
      email: string;
      nome: string;
    }
  | {
      persona: UserRole; // owner | manager | barber
      userId: string;
      orgId: string;
      role: UserRole;
      email: string;
      nome: string;
    }
  | {
      persona: "client";
      clienteId: string;
      orgId: string;
      email: string;
      nome: string;
    };

const EXPIRES_IN = "30d";

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(EXPIRES_IN)
    .sign(secret);
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function isStaff(s: SessionPayload): s is Extract<
  SessionPayload,
  { persona: UserRole }
> {
  return (
    s.persona === "owner" || s.persona === "manager" || s.persona === "barber"
  );
}
