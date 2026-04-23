"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffSession } from "@/lib/auth/session";
import { ServicosRepo } from "@/infrastructure/database/repositories/servicos.repo";

const schema = z.object({
  nome: z.string().min(2),
  duracaoMin: z.coerce.number().int().min(5),
  precoQuinzenal: z.string().regex(/^\d+(\.\d{1,2})?$/),
  precoMensal: z.string().regex(/^\d+(\.\d{1,2})?$/),
  precoEventual: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

function parse(formData: FormData) {
  return schema.parse({
    nome: formData.get("nome"),
    duracaoMin: formData.get("duracaoMin"),
    precoQuinzenal: formData.get("precoQuinzenal"),
    precoMensal: formData.get("precoMensal"),
    precoEventual: formData.get("precoEventual"),
  });
}

export async function criarServico(formData: FormData) {
  const session = await requireStaffSession();
  const data = parse(formData);
  const repo = new ServicosRepo(session.orgId);
  await repo.create(data);
  revalidatePath("/servicos");
}

export async function atualizarServico(id: string, formData: FormData) {
  const session = await requireStaffSession();
  const data = parse(formData);
  const ativo = formData.get("ativo") === "on";
  const repo = new ServicosRepo(session.orgId);
  await repo.update(id, {
    nome: data.nome,
    duracao_min: data.duracaoMin,
    preco_quinzenal: data.precoQuinzenal,
    preco_mensal: data.precoMensal,
    preco_eventual: data.precoEventual,
    ativo,
  });
  revalidatePath("/servicos");
}
