"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";

const schema = z.object({
  nome: z.string().min(2),
  telefone: z.string().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  corPrimaria: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .or(z.literal("")),
});

export async function atualizarBarbearia(formData: FormData) {
  const session = await requireDonoOuGerente();
  const parsed = schema.parse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    logoUrl: formData.get("logoUrl"),
    corPrimaria: formData.get("corPrimaria"),
  });

  const repo = new BarbeariasRepo(session.barbeariaId);
  await repo.atualizarPerfil({
    nome: parsed.nome,
    telefone: parsed.telefone || null,
    logo_url: parsed.logoUrl || null,
  });

  // Cor primária vai pra config.paleta
  if (parsed.corPrimaria) {
    const atual = await repo.get();
    await repo.atualizarConfig({
      paleta: {
        ...(atual?.config.paleta ?? {}),
        primary: parsed.corPrimaria,
      },
    });
  }

  revalidatePath("/config");
  revalidatePath("/", "layout"); // força reaplicar a paleta no layout
}
