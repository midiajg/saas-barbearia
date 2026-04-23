"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { buscarOrganizationPorSlug } from "@/infrastructure/database/repositories/organization.repo";
import {
  buscarClientePorEmail,
  criarClienteComAuth,
} from "@/infrastructure/database/repositories/cliente-auth.repo";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const schema = z.object({
  nome: z.string().min(2),
  telefone: z.string().optional().or(z.literal("")),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signupClienteAction(slug: string, formData: FormData) {
  const parsed = schema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const org = await buscarOrganizationPorSlug(slug);
  if (!org) throw new Error("Barbearia não encontrada");

  const existing = await buscarClientePorEmail(org.id, parsed.data.email);
  if (existing) throw new Error("Email já cadastrado nesta barbearia");

  const passwordHash = await hashPassword(parsed.data.password);
  const cliente = await criarClienteComAuth({
    orgId: org.id,
    nome: parsed.data.nome,
    email: parsed.data.email,
    passwordHash,
    telefone: parsed.data.telefone || undefined,
  });

  await createSession({
    persona: "client",
    clienteId: cliente.id,
    orgId: cliente.org_id,
    email: parsed.data.email,
    nome: cliente.nome,
  });

  redirect(`/c/${slug}/minha-conta`);
}
