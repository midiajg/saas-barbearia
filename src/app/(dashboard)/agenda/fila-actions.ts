"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import type { FilaItem } from "@/infrastructure/database/types";

const schema = z.object({
  cliente_id: z.string().uuid(),
  barbeiro_id: z.string().uuid().optional(),
  observacao: z.string().optional(),
});

export async function adicionarFila(input: z.infer<typeof schema>) {
  const session = await requireSession();
  const data = schema.parse(input);
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const novo: FilaItem = {
    id: randomUUID(),
    cliente_id: data.cliente_id,
    barbeiro_id: data.barbeiro_id,
    observacao: data.observacao,
    criado_em: new Date().toISOString(),
  };
  await repo.atualizarConfig({
    fila_espera: [...(barbearia.config.fila_espera ?? []), novo],
  });
  revalidatePath("/agenda");
}

export async function removerFila(id: string) {
  const session = await requireSession();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");
  await repo.atualizarConfig({
    fila_espera: (barbearia.config.fila_espera ?? []).filter((f) => f.id !== id),
  });
  revalidatePath("/agenda");
}
