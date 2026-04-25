"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import type { Despesa } from "@/infrastructure/database/types";

const schema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  descricao: z.string().min(1),
  categoria: z.string().min(1),
  valor: z.coerce.number().min(0.01),
  pago: z.boolean().default(false),
});

export async function adicionarDespesa(formData: FormData) {
  const session = await requireDonoOuGerente();
  const data = schema.parse({
    data: formData.get("data"),
    descricao: formData.get("descricao"),
    categoria: formData.get("categoria"),
    valor: formData.get("valor"),
    pago: formData.get("pago") === "on",
  });
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");
  const nova: Despesa = {
    id: randomUUID(),
    data: data.data,
    descricao: data.descricao,
    categoria: data.categoria,
    valor: data.valor,
    pago: data.pago,
  };
  await repo.atualizarConfig({
    despesas: [...(barbearia.config.despesas ?? []), nova],
  });
  revalidatePath("/financeiro/despesas");
  revalidatePath("/financeiro/relatorios");
}

export async function togglePago(id: string) {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");
  await repo.atualizarConfig({
    despesas: (barbearia.config.despesas ?? []).map((d) =>
      d.id === id ? { ...d, pago: !d.pago } : d
    ),
  });
  revalidatePath("/financeiro/despesas");
}

export async function removerDespesa(id: string) {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");
  await repo.atualizarConfig({
    despesas: (barbearia.config.despesas ?? []).filter((d) => d.id !== id),
  });
  revalidatePath("/financeiro/despesas");
}
