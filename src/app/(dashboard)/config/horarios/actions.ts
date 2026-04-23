"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffSession } from "@/lib/auth/session";
import { HorariosRepo } from "@/infrastructure/database/repositories/horarios.repo";

const horarioSchema = z.object({
  diaSemana: z.number().int().min(0).max(6),
  abertura: z.string().regex(/^\d{2}:\d{2}$/),
  fechamento: z.string().regex(/^\d{2}:\d{2}$/),
  ativo: z.boolean(),
});

export async function salvarHorario(input: z.infer<typeof horarioSchema>) {
  const session = await requireStaffSession();
  const parsed = horarioSchema.parse(input);
  const repo = new HorariosRepo(session.orgId);
  await repo.upsertDia({
    diaSemana: parsed.diaSemana,
    abertura: `${parsed.abertura}:00`,
    fechamento: `${parsed.fechamento}:00`,
    ativo: parsed.ativo,
  });
  revalidatePath("/config/horarios");
}

const feriadoSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  descricao: z.string().min(1),
});

export async function adicionarFeriado(formData: FormData) {
  const session = await requireStaffSession();
  const parsed = feriadoSchema.parse({
    data: formData.get("data"),
    descricao: formData.get("descricao"),
  });
  const repo = new HorariosRepo(session.orgId);
  await repo.addFeriado(parsed);
  revalidatePath("/config/horarios");
}

export async function removerFeriado(id: string) {
  const session = await requireStaffSession();
  const repo = new HorariosRepo(session.orgId);
  await repo.removeFeriado(id);
  revalidatePath("/config/horarios");
}
