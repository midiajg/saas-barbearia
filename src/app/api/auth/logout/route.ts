import { NextResponse } from "next/server";
import {
  destroySession,
  destroySessionCliente,
  destroySessionEquipe,
} from "@/lib/auth/session";

// POST com ?tipo=equipe|cliente pra escolher qual deslogar
// Sem query = desloga os dois
export async function POST(request: Request) {
  const url = new URL(request.url);
  const tipo = url.searchParams.get("tipo");

  if (tipo === "equipe") {
    await destroySessionEquipe();
  } else if (tipo === "cliente") {
    await destroySessionCliente();
  } else {
    await destroySession();
  }
  return NextResponse.json({ ok: true });
}
