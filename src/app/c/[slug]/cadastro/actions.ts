"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { buscarBarbeariaPorSlug, BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import {
  ClientesRepo,
  buscarClientePorAuthEmail,
} from "@/infrastructure/database/repositories/clientes.repo";

const schema = z.object({
  nome: z.string().min(2),
  telefone: z.string().optional(),
  email: z.string().email(),
  senha: z.string().min(6),
  ref: z.string().uuid().optional(),
});

export async function cadastrarClienteAction(
  slug: string,
  formData: FormData
) {
  const barbearia = await buscarBarbeariaPorSlug(slug);
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const parsed = schema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone") || undefined,
    email: formData.get("email"),
    senha: formData.get("senha"),
    ref: formData.get("ref") || undefined,
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const existente = await buscarClientePorAuthEmail(
    parsed.data.email,
    barbearia.id
  );
  if (existente) throw new Error("Email já cadastrado nesta barbearia");

  const senhaHash = await hashPassword(parsed.data.senha);
  const repo = new ClientesRepo(barbearia.id);
  const cliente = await repo.criarComAuth({
    nome: parsed.data.nome,
    telefone: parsed.data.telefone,
    email: parsed.data.email,
    authEmail: parsed.data.email,
    authSenhaHash: senhaHash,
  });

  // Premia indicador (se vier ?ref=clienteId válido)
  if (parsed.data.ref && parsed.data.ref !== cliente.id) {
    const indicador = await repo.get(parsed.data.ref);
    if (indicador) {
      const barbeariaRepo = new BarbeariasRepo(barbearia.id);
      const barbCompleta = await barbeariaRepo.get();
      const pontos = barbCompleta?.config.fpts_regras.indicacao ?? 500;
      await repo.registrarEvento(
        indicador.id,
        {
          tipo: "indicacao",
          pontos,
          descricao: `Indicou ${parsed.data.nome}`,
        },
        barbCompleta?.config.niveis ?? []
      );
    }
  }

  await createSession({
    tipo: "cliente",
    clienteId: cliente.id,
    barbeariaId: barbearia.id,
    barbeariaSlug: barbearia.slug,
    email: parsed.data.email,
    nome: parsed.data.nome,
  });

  redirect(`/c/${slug}/agendar`);
}
