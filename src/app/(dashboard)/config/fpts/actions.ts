"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";

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
