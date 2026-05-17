"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import type { FptsRegraCustom } from "@/infrastructure/database/types";

const schema = z.object({
  google: z.coerce.number().int().min(0),
  indicacao: z.coerce.number().int().min(0),
  instagram: z.coerce.number().int().min(0),
  pontualidade: z.coerce.number().int().min(0),
  aniversario: z.coerce.number().int().min(0),
  fpts_por_real: z.coerce.number().int().min(1),
  max_pct: z.coerce.number().int().min(0).max(100),
});

export async function salvarRegrasFpts(formData: FormData) {
  const session = await requireDonoOuGerente();
  const data = schema.parse({
    google: formData.get("google"),
    indicacao: formData.get("indicacao"),
    instagram: formData.get("instagram"),
    pontualidade: formData.get("pontualidade"),
    aniversario: formData.get("aniversario"),
    fpts_por_real: formData.get("fpts_por_real"),
    max_pct: formData.get("max_pct"),
  });
  const repo = new BarbeariasRepo(session.barbeariaId);
  await repo.atualizarConfig({
    fpts_regras: {
      google: data.google,
      indicacao: data.indicacao,
      instagram: data.instagram,
      pontualidade: data.pontualidade,
      aniversario: data.aniversario,
    },
    cashback: {
      fpts_por_real: data.fpts_por_real,
      max_pct: data.max_pct,
    },
  });
  revalidatePath("/config/fpts");
}

const customSchema = z.object({
  icone: z.string().min(1).max(4),
  label: z.string().min(2).max(40),
  valor: z.coerce.number().int().min(0),
});

export async function adicionarPontuacaoCustom(formData: FormData) {
  const session = await requireDonoOuGerente();
  const data = customSchema.parse({
    icone: formData.get("icone"),
    label: formData.get("label"),
    valor: formData.get("valor"),
  });
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const nova: FptsRegraCustom = {
    id: randomUUID(),
    icone: data.icone,
    label: data.label,
    valor: data.valor,
    ativo: true,
  };
  await repo.atualizarConfig({
    pontuacoes_custom: [
      ...(barbearia.config.pontuacoes_custom ?? []),
      nova,
    ],
  });
  revalidatePath("/config/fpts");
  revalidatePath("/clientes");
  revalidatePath("/agenda");
}

export async function removerPontuacaoCustom(id: string) {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");
  await repo.atualizarConfig({
    pontuacoes_custom: (barbearia.config.pontuacoes_custom ?? []).filter(
      (p) => p.id !== id
    ),
  });
  revalidatePath("/config/fpts");
  revalidatePath("/clientes");
  revalidatePath("/agenda");
}
