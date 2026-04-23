"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { buscarOrganizationPorSlug } from "@/infrastructure/database/repositories/organization.repo";
import { buscarClientePorEmail } from "@/infrastructure/database/repositories/cliente-auth.repo";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginClienteAction(slug: string, formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const org = await buscarOrganizationPorSlug(slug);
  if (!org) throw new Error("Barbearia não encontrada");

  const cliente = await buscarClientePorEmail(org.id, parsed.data.email);
  if (!cliente || !cliente.auth_password_hash) {
    throw new Error("Email ou senha incorretos");
  }

  const valid = await verifyPassword(
    parsed.data.password,
    cliente.auth_password_hash
  );
  if (!valid) throw new Error("Email ou senha incorretos");

  await createSession({
    persona: "client",
    clienteId: cliente.id,
    orgId: cliente.org_id,
    email: cliente.auth_email ?? parsed.data.email,
    nome: cliente.nome,
  });

  redirect(`/c/${slug}/minha-conta`);
}
