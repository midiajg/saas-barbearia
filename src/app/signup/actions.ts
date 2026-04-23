"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "@/infrastructure/database/client";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

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

export async function signupAction(formData: FormData) {
  const parsed = signupSchema.safeParse({
    nomeBarbearia: formData.get("nomeBarbearia"),
    nome: formData.get("nome"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos");
  }

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (existing) {
    throw new Error("Email já cadastrado");
  }

  const baseSlug = slugify(parsed.data.nomeBarbearia);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  const passwordHash = await hashPassword(parsed.data.password);

  const { data: org, error: orgErr } = await supabaseAdmin
    .from("organizations")
    .insert({
      nome: parsed.data.nomeBarbearia,
      slug,
    })
    .select()
    .single();
  if (orgErr) throw orgErr;

  const { data: user, error: userErr } = await supabaseAdmin
    .from("users")
    .insert({
      org_id: org.id,
      email: parsed.data.email,
      password_hash: passwordHash,
      nome: parsed.data.nome,
      role: "owner",
    })
    .select()
    .single();
  if (userErr) throw userErr;

  // Horários padrão: seg-sex 9h-20h, sáb 8h-18h, dom fechado
  await supabaseAdmin.from("horarios").insert([
    { org_id: org.id, dia_semana: 0, abertura: "09:00:00", fechamento: "14:00:00", ativo: false },
    { org_id: org.id, dia_semana: 1, abertura: "09:00:00", fechamento: "20:00:00", ativo: true },
    { org_id: org.id, dia_semana: 2, abertura: "09:00:00", fechamento: "20:00:00", ativo: true },
    { org_id: org.id, dia_semana: 3, abertura: "09:00:00", fechamento: "20:00:00", ativo: true },
    { org_id: org.id, dia_semana: 4, abertura: "09:00:00", fechamento: "20:00:00", ativo: true },
    { org_id: org.id, dia_semana: 5, abertura: "09:00:00", fechamento: "20:00:00", ativo: true },
    { org_id: org.id, dia_semana: 6, abertura: "08:00:00", fechamento: "18:00:00", ativo: true },
  ]);

  // Níveis padrão de fidelidade
  await supabaseAdmin.from("niveis").insert([
    { org_id: org.id, numero: 1, nome: "Bronze", min_fpts: 0, beneficios: { descontoProdutos: 0 } },
    { org_id: org.id, numero: 2, nome: "Prata", min_fpts: 500, beneficios: { descontoProdutos: 5, bonusIndicacao: 10 } },
    {
      org_id: org.id,
      numero: 3,
      nome: "Ouro",
      min_fpts: 1500,
      beneficios: {
        descontoProdutos: 15,
        bonusIndicacao: 30,
        servicosGratis: ["1 hidracorte/nutricorte por mês"],
      },
    },
  ]);

  await createSession({
    persona: user.role,
    userId: user.id,
    orgId: user.org_id,
    role: user.role,
    email: user.email,
    nome: user.nome,
  });

  redirect("/dashboard");
}
