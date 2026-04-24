"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import type { Nivel } from "@/infrastructure/database/types";

const nivelSchema = z.object({
  numero: z.coerce.number().int().min(1),
  nome: z.string().min(1),
  min_fpts: z.coerce.number().int().min(0),
  beneficios: z.array(z.string()),
});

export async function salvarNiveis(niveis: z.infer<typeof nivelSchema>[]) {
  const session = await requireDonoOuGerente();
  const parsed = z.array(nivelSchema).parse(niveis);
  const repo = new BarbeariasRepo(session.barbeariaId);
  const ordenados: Nivel[] = parsed
    .sort((a, b) => a.min_fpts - b.min_fpts)
    .map((n) => ({
      numero: n.numero,
      nome: n.nome,
      min_fpts: n.min_fpts,
      beneficios: n.beneficios.filter((b) => b.trim().length > 0),
    }));
  await repo.salvarNiveis(ordenados);
  revalidatePath("/config/niveis");
}
