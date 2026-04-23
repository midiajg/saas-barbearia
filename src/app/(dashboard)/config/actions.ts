"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwnerOrManager } from "@/lib/auth/session";
import { OrganizationRepo } from "@/infrastructure/database/repositories/organization.repo";

const schema = z.object({
  nome: z.string().min(2),
  logoUrl: z.string().url().optional().or(z.literal("")),
  fusoHorario: z.string().min(3),
});

export async function atualizarBarbearia(formData: FormData) {
  const session = await requireOwnerOrManager();
  const parsed = schema.parse({
    nome: formData.get("nome"),
    logoUrl: formData.get("logoUrl"),
    fusoHorario: formData.get("fusoHorario"),
  });

  const repo = new OrganizationRepo(session.orgId);
  await repo.update({
    nome: parsed.nome,
    logo_url: parsed.logoUrl || null,
    fuso_horario: parsed.fusoHorario,
  });

  revalidatePath("/config");
}
