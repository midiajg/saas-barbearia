"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import type { Bloqueio } from "@/infrastructure/database/types";

const schema = z.object({
  barbeiro_id: z.string().uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  inicio: z.string().regex(/^\d{2}:\d{2}$/),
  fim: z.string().regex(/^\d{2}:\d{2}$/),
  motivo: z.string().optional(),
  motivo_tipo: z.enum(["almoco", "ausencia_medica", "folga", "outros"]).optional(),
});

export async function adicionarBloqueio(formData: FormData) {
  const session = await requireSession();
  const data = schema.parse({
    barbeiro_id: formData.get("barbeiro_id"),
    data: formData.get("data"),
    inicio: formData.get("inicio"),
    fim: formData.get("fim"),
    motivo: formData.get("motivo") || undefined,
    motivo_tipo: formData.get("motivo_tipo") || undefined,
  });

  // Barbeiro só pode criar bloqueio pra ele mesmo.
  if (session.cargo === "barbeiro" && data.barbeiro_id !== session.equipeId) {
    throw new Error("Barbeiro só pode bloquear a própria agenda");
  }

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
    motivo_tipo: data.motivo_tipo,
  };
  await repo.atualizarConfig({
    bloqueios: [...(barbearia.config.bloqueios ?? []), novo],
  });
  revalidatePath("/config/bloqueios");
  revalidatePath("/agenda");
}

export async function removerBloqueio(id: string) {
  const session = await requireSession();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const alvo = (barbearia.config.bloqueios ?? []).find((b) => b.id === id);
  if (!alvo) throw new Error("Bloqueio não encontrado");
  if (session.cargo === "barbeiro" && alvo.barbeiro_id !== session.equipeId) {
    throw new Error("Barbeiro só pode remover bloqueio da própria agenda");
  }

  await repo.atualizarConfig({
    bloqueios: (barbearia.config.bloqueios ?? []).filter((b) => b.id !== id),
  });
  revalidatePath("/config/bloqueios");
  revalidatePath("/agenda");
}
