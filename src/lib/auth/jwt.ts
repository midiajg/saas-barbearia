import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import type { Cargo } from "@/infrastructure/database/types";

const secret = new TextEncoder().encode(env.AUTH_SECRET);
const ISSUER = "barbearia-sistema";
const EXPIRES_IN = "30d";

export type SessionPayload = {
  equipeId: string;
  barbeariaId: string;
  cargo: Cargo;
  email: string;
  nome: string;
};

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
