"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { buscarEquipePorEmail } from "@/infrastructure/database/repositories/equipe.repo";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const pessoa = await buscarEquipePorEmail(parsed.data.email);
  if (!pessoa) throw new Error("Email ou senha incorretos");

  const ok = await verifyPassword(parsed.data.password, pessoa.senha_hash);
  if (!ok) throw new Error("Email ou senha incorretos");

  await createSession({
    tipo: "equipe",
    equipeId: pessoa.id,
    barbeariaId: pessoa.barbearia_id,
    cargo: pessoa.cargo,
    email: pessoa.email,
    nome: pessoa.nome,
  });

  redirect("/dashboard");
}
