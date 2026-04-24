"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { buscarBarbeariaPorSlug } from "@/infrastructure/database/repositories/barbearias.repo";
import { buscarClientePorAuthEmail } from "@/infrastructure/database/repositories/clientes.repo";

const schema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export async function loginClienteAction(slug: string, formData: FormData) {
  const barbearia = await buscarBarbeariaPorSlug(slug);
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const parsed = schema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const cliente = await buscarClientePorAuthEmail(
    parsed.data.email,
    barbearia.id
  );
  if (!cliente || !cliente.auth_senha_hash)
    throw new Error("Email ou senha incorretos");

  const ok = await verifyPassword(parsed.data.senha, cliente.auth_senha_hash);
  if (!ok) throw new Error("Email ou senha incorretos");

  await createSession({
    tipo: "cliente",
    clienteId: cliente.id,
    barbeariaId: barbearia.id,
    barbeariaSlug: barbearia.slug,
    email: parsed.data.email,
    nome: cliente.nome,
  });

  redirect(`/c/${slug}`);
}
