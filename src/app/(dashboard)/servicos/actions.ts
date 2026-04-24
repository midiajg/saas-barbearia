"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import type { CatalogoServico } from "@/infrastructure/database/types";

const schema = z.object({
  nome: z.string().min(2),
  descricao: z.string().optional(),
  duracao_min: z.coerce.number().int().min(5),
  preco_quinzenal: z.coerce.number().min(0),
  preco_mensal: z.coerce.number().min(0),
  preco_eventual: z.coerce.number().min(0),
});

function parse(formData: FormData) {
  return schema.parse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || undefined,
    duracao_min: formData.get("duracao_min"),
    preco_quinzenal: formData.get("preco_quinzenal"),
    preco_mensal: formData.get("preco_mensal"),
    preco_eventual: formData.get("preco_eventual"),
  });
}

export async function criarServico(formData: FormData) {
  const session = await requireDonoOuGerente();
  const data = parse(formData);
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const novo: CatalogoServico = {
    id: randomUUID(),
    nome: data.nome,
    descricao: data.descricao,
    duracao_min: data.duracao_min,
    preco_quinzenal: data.preco_quinzenal,
    preco_mensal: data.preco_mensal,
    preco_eventual: data.preco_eventual,
    ativo: true,
  };
  await repo.salvarCatalogoServicos([
    ...barbearia.config.catalogo_servicos,
    novo,
  ]);
  revalidatePath("/servicos");
}

export async function atualizarServico(id: string, formData: FormData) {
  const session = await requireDonoOuGerente();
  const data = parse(formData);
  const ativo = formData.get("ativo") === "on";
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const atualizado = barbearia.config.catalogo_servicos.map((s) =>
    s.id === id
      ? {
          ...s,
          nome: data.nome,
          descricao: data.descricao,
          duracao_min: data.duracao_min,
          preco_quinzenal: data.preco_quinzenal,
          preco_mensal: data.preco_mensal,
          preco_eventual: data.preco_eventual,
          ativo,
        }
      : s
  );
  await repo.salvarCatalogoServicos(atualizado);
  revalidatePath("/servicos");
}

export async function deletarServico(id: string) {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");
  await repo.salvarCatalogoServicos(
    barbearia.config.catalogo_servicos.filter((s) => s.id !== id)
  );
  revalidatePath("/servicos");
}
