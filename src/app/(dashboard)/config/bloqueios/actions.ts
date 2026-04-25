"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import type { Bloqueio } from "@/infrastructure/database/types";

const schema = z.object({
  barbeiro_id: z.string().uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  inicio: z.string().regex(/^\d{2}:\d{2}$/),
  fim: z.string().regex(/^\d{2}:\d{2}$/),
  motivo: z.string().optional(),
});

export async function adicionarBloqueio(formData: FormData) {
  const session = await requireDonoOuGerente();
  const data = schema.parse({
    barbeiro_id: formData.get("barbeiro_id"),
    data: formData.get("data"),
    inicio: formData.get("inicio"),
    fim: formData.get("fim"),
    motivo: formData.get("motivo") || undefined,
  });
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const inicioISO = new Date(`${data.data}T${data.inicio}:00`).toISOString();
  const fimISO = new Date(`${data.data}T${data.fim}:00`).toISOString();
  if (new Date(fimISO) <= new Date(inicioISO))
    throw new Error("Fim deve ser depois do início");

  const novo: Bloqueio = {
    id: randomUUID(),
    barbeiro_id: data.barbeiro_id,
    inicio: inicioISO,
    fim: fimISO,
    motivo: data.motivo,
  };
  await repo.atualizarConfig({
    bloqueios: [...(barbearia.config.bloqueios ?? []), novo],
  });
  revalidatePath("/config/bloqueios");
  revalidatePath("/agenda");
}

export async function removerBloqueio(id: string) {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");
  await repo.atualizarConfig({
    bloqueios: (barbearia.config.bloqueios ?? []).filter((b) => b.id !== id),
  });
  revalidatePath("/config/bloqueios");
  revalidatePath("/agenda");
}
