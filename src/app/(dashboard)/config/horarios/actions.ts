"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import type { Feriado, Horario } from "@/infrastructure/database/types";

const horarioSchema = z.object({
  diaSemana: z.number().int().min(0).max(6),
  abertura: z.string().regex(/^\d{2}:\d{2}$/),
  fechamento: z.string().regex(/^\d{2}:\d{2}$/),
  ativo: z.boolean(),
});

export async function salvarHorario(input: z.infer<typeof horarioSchema>) {
  const session = await requireDonoOuGerente();
  const parsed = horarioSchema.parse(input);
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const atuais = barbearia.config.horarios ?? [];
  const outros = atuais.filter((h) => h.dia_semana !== parsed.diaSemana);
  const novo: Horario = {
    dia_semana: parsed.diaSemana,
    abertura: parsed.abertura,
    fechamento: parsed.fechamento,
    ativo: parsed.ativo,
  };
  await repo.salvarHorarios([...outros, novo].sort((a, b) => a.dia_semana - b.dia_semana));
  revalidatePath("/config/horarios");
}

const feriadoSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  descricao: z.string().min(1),
});

export async function adicionarFeriado(formData: FormData) {
  const session = await requireDonoOuGerente();
  const parsed = feriadoSchema.parse({
    data: formData.get("data"),
    descricao: formData.get("descricao"),
  });
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");
  const novos: Feriado[] = [
    ...barbearia.config.feriados,
    { data: parsed.data, descricao: parsed.descricao },
  ];
  await repo.salvarFeriados(novos);
  revalidatePath("/config/horarios");
}

export async function removerFeriado(data: string) {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");
  await repo.salvarFeriados(
    barbearia.config.feriados.filter((f) => f.data !== data)
  );
  revalidatePath("/config/horarios");
}
