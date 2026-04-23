import { supabaseAdmin } from "@/infrastructure/database/client";
import type { Cliente } from "../types";

/**
 * Auth do cliente — não usa BaseRepo porque em login/signup ainda
 * não temos orgId derivado da sessão (depende da barbearia pelo slug).
 */
export async function buscarClientePorEmail(
  orgId: string,
  email: string
): Promise<Cliente | null> {
  const { data, error } = await supabaseAdmin
    .from("clientes")
    .select("*")
    .eq("org_id", orgId)
    .eq("auth_email", email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function criarClienteComAuth(input: {
  orgId: string;
  nome: string;
  email: string;
  passwordHash: string;
  telefone?: string;
}): Promise<Cliente> {
  const { data, error } = await supabaseAdmin
    .from("clientes")
    .insert({
      org_id: input.orgId,
      nome: input.nome,
      telefone: input.telefone,
      email: input.email,
      auth_email: input.email,
      auth_password_hash: input.passwordHash,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarSenhaCliente(
  clienteId: string,
  passwordHash: string
) {
  const { error } = await supabaseAdmin
    .from("clientes")
    .update({ auth_password_hash: passwordHash })
    .eq("id", clienteId);
  if (error) throw error;
}
