"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import {
  buscarBarbeariaPorSlug,
  criarBarbearia,
  BarbeariasRepo,
} from "@/infrastructure/database/repositories/barbearias.repo";
import {
  EquipeRepo,
  buscarEquipePorEmail,
} from "@/infrastructure/database/repositories/equipe.repo";
import type { Horario, Nivel } from "@/infrastructure/database/types";

const signupSchema = z.object({
  nomeBarbearia: z.string().min(2),
  nome: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const HORARIOS_PADRAO: Horario[] = [
  { dia_semana: 0, abertura: "09:00", fechamento: "14:00", ativo: false },
  { dia_semana: 1, abertura: "09:00", fechamento: "20:00", ativo: true },
  { dia_semana: 2, abertura: "09:00", fechamento: "20:00", ativo: true },
  { dia_semana: 3, abertura: "09:00", fechamento: "20:00", ativo: true },
  { dia_semana: 4, abertura: "09:00", fechamento: "20:00", ativo: true },
  { dia_semana: 5, abertura: "09:00", fechamento: "20:00", ativo: true },
  { dia_semana: 6, abertura: "08:00", fechamento: "18:00", ativo: true },
];

const NIVEIS_PADRAO: Nivel[] = [
  { numero: 1, nome: "Bronze", min_fpts: 0, beneficios: [] },
  {
    numero: 2,
    nome: "Prata",
    min_fpts: 500,
    beneficios: ["5% em produtos", "+10% FPTS por indicação"],
  },
  {
    numero: 3,
    nome: "Ouro",
    min_fpts: 1500,
    beneficios: [
      "15% em produtos",
      "+30% FPTS por indicação",
      "1 hidracorte/mês",
    ],
  },
];

export async function signupAction(formData: FormData) {
  const parsed = signupSchema.safeParse({
    nomeBarbearia: formData.get("nomeBarbearia"),
    nome: formData.get("nome"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const existe = await buscarEquipePorEmail(parsed.data.email);
  if (existe) throw new Error("Email já cadastrado");

  // slug único
  let base = slugify(parsed.data.nomeBarbearia);
  if (!base) base = "barbearia";
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const achou = await buscarBarbeariaPorSlug(slug);
    if (!achou) break;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const barbearia = await criarBarbearia({
    nome: parsed.data.nomeBarbearia,
    slug,
  });

  const barbeariasRepo = new BarbeariasRepo(barbearia.id);
  await barbeariasRepo.atualizarConfig({
    horarios: HORARIOS_PADRAO,
    niveis: NIVEIS_PADRAO,
  });

  const senhaHash = await hashPassword(parsed.data.password);
  const equipeRepo = new EquipeRepo(barbearia.id);
  const pessoa = await equipeRepo.criar({
    nome: parsed.data.nome,
    email: parsed.data.email,
    senhaHash,
    cargo: "dono",
  });

  await createSession({
    equipeId: pessoa.id,
    barbeariaId: barbearia.id,
    cargo: "dono",
    email: pessoa.email,
    nome: pessoa.nome,
  });

  redirect("/dashboard");
}
