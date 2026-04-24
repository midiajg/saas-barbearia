"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDonoOuGerente } from "@/lib/auth/session";
import { EquipeRepo } from "@/infrastructure/database/repositories/equipe.repo";
import { hashPassword } from "@/lib/auth/password";

const baseSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  cargo: z.enum(["dono", "gerente", "barbeiro"]),
  cor: z.string().default("#45D4C0"),
  comissao: z.coerce.number().min(0).max(100),
  foto_url: z.string().optional(),
});

export async function criarPessoa(formData: FormData) {
  const session = await requireDonoOuGerente();
  const data = baseSchema.parse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    cargo: formData.get("cargo"),
    cor: formData.get("cor") || "#45D4C0",
    comissao: formData.get("comissao"),
    foto_url: formData.get("foto_url") || undefined,
  });
  const senha = formData.get("senha");
  if (typeof senha !== "string" || senha.length < 8)
    throw new Error("Senha mínima de 8 caracteres");
  const senhaHash = await hashPassword(senha);

  const repo = new EquipeRepo(session.barbeariaId);
  await repo.criar({
    nome: data.nome,
    email: data.email,
    senhaHash,
    cargo: data.cargo,
    cor: data.cor,
    comissaoPct: data.comissao,
    fotoUrl: data.foto_url,
  });
  revalidatePath("/equipe");
}

export async function atualizarPessoa(id: string, formData: FormData) {
  const session = await requireDonoOuGerente();
  const data = baseSchema.parse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    cargo: formData.get("cargo"),
    cor: formData.get("cor") || "#45D4C0",
    comissao: formData.get("comissao"),
    foto_url: formData.get("foto_url") || undefined,
  });
  const ativo = formData.get("ativo") === "on";

  const repo = new EquipeRepo(session.barbeariaId);
  await repo.atualizar(id, {
    nome: data.nome,
    email: data.email,
    cargo: data.cargo,
    cor: data.cor,
    comissao_pct: data.comissao,
    foto_url: data.foto_url ?? null,
    ativo,
  });

  const senha = formData.get("senha");
  if (typeof senha === "string" && senha.length >= 8) {
    await repo.atualizarSenha(id, await hashPassword(senha));
  }
  revalidatePath("/equipe");
}
