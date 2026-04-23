"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "@/infrastructure/database/client";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos");
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (!user) {
    throw new Error("Email ou senha incorretos");
  }

  const valid = await verifyPassword(parsed.data.password, user.password_hash);
  if (!valid) {
    throw new Error("Email ou senha incorretos");
  }

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
