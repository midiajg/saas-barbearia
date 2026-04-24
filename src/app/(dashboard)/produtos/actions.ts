"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import type { CatalogoProduto } from "@/infrastructure/database/types";

const descontoSchema = z.record(z.string(), z.coerce.number().min(0).max(100));

const schema = z.object({
  nome: z.string().min(2),
  descricao: z.string().optional(),
  preco: z.coerce.number().min(0),
  estoque: z.coerce.number().int().min(0),
  descontoPorNivel: z.string().optional(),
});

function parse(formData: FormData) {
  const raw = schema.parse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || undefined,
    preco: formData.get("preco"),
    estoque: formData.get("estoque"),
    descontoPorNivel: formData.get("descontoPorNivel") || undefined,
  });
  let descontoPorNivel: Record<string, number> | null = null;
  if (raw.descontoPorNivel) {
    try {
      descontoPorNivel = descontoSchema.parse(JSON.parse(raw.descontoPorNivel));
    } catch {
      throw new Error("Desconto por nível inválido");
    }
  }
  return { ...raw, descontoPorNivel };
}

export async function criarProduto(formData: FormData) {
  const session = await requireDonoOuGerente();
  const data = parse(formData);
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const novo: CatalogoProduto = {
    id: randomUUID(),
    nome: data.nome,
    descricao: data.descricao,
    preco: data.preco,
    estoque: data.estoque,
    desconto_por_nivel: data.descontoPorNivel,
    ativo: true,
  };
  await repo.salvarCatalogoProdutos([
    ...barbearia.config.catalogo_produtos,
    novo,
  ]);
  revalidatePath("/produtos");
}

export async function atualizarProduto(id: string, formData: FormData) {
  const session = await requireDonoOuGerente();
  const data = parse(formData);
  const ativo = formData.get("ativo") === "on";
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const atualizado = barbearia.config.catalogo_produtos.map((p) =>
    p.id === id
      ? {
          ...p,
          nome: data.nome,
          descricao: data.descricao,
          preco: data.preco,
          estoque: data.estoque,
          desconto_por_nivel: data.descontoPorNivel,
          ativo,
        }
      : p
  );
  await repo.salvarCatalogoProdutos(atualizado);
  revalidatePath("/produtos");
}

export async function deletarProduto(id: string) {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");
  await repo.salvarCatalogoProdutos(
    barbearia.config.catalogo_produtos.filter((p) => p.id !== id)
  );
  revalidatePath("/produtos");
}
