"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffSession } from "@/lib/auth/session";
import { BarbeirosRepo } from "@/infrastructure/database/repositories/barbeiros.repo";

const baseSchema = z.object({
  nome: z.string().min(2),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  percentualComissao: z.string().regex(/^\d+(\.\d{1,2})?$/),
  fotoUrl: z.string().url().optional().or(z.literal("")),
  servicoIds: z.array(z.string().uuid()),
});

function parseForm(formData: FormData) {
  const servicoIdsRaw = formData.get("servicoIds");
  const servicoIds: string[] =
    typeof servicoIdsRaw === "string" ? JSON.parse(servicoIdsRaw) : [];
  return baseSchema.parse({
    nome: formData.get("nome"),
    cor: formData.get("cor"),
    percentualComissao: formData.get("percentualComissao"),
    fotoUrl: formData.get("fotoUrl"),
    servicoIds,
  });
}

export async function criarBarbeiro(formData: FormData) {
  const session = await requireStaffSession();
  const data = parseForm(formData);
  const repo = new BarbeirosRepo(session.orgId);

  const created = await repo.create({
    nome: data.nome,
    cor: data.cor,
    percentualComissao: data.percentualComissao,
    fotoUrl: data.fotoUrl || undefined,
  });
  await repo.setServicos(created.id, data.servicoIds);
  revalidatePath("/barbeiros");
  revalidatePath("/agenda");
}

export async function atualizarBarbeiro(id: string, formData: FormData) {
  const session = await requireStaffSession();
  const data = parseForm(formData);
  const ativo = formData.get("ativo") === "on";
  const repo = new BarbeirosRepo(session.orgId);

  await repo.update(id, {
    nome: data.nome,
    cor: data.cor,
    percentual_comissao: data.percentualComissao,
    foto_url: data.fotoUrl || null,
    ativo,
  });
  await repo.setServicos(id, data.servicoIds);
  revalidatePath("/barbeiros");
  revalidatePath("/agenda");
}
