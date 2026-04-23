import { supabaseAdmin } from "@/infrastructure/database/client";
import type {
  Agendamento,
  Cliente,
  FptsEvento,
  Nivel,
} from "../types";

/**
 * Queries pro portal do cliente — lookup escopado pelo clienteId,
 * não pelo orgId de sessão de staff.
 */

export async function getClienteDoPortal(clienteId: string): Promise<Cliente | null> {
  const { data, error } = await supabaseAdmin
    .from("clientes")
    .select("*")
    .eq("id", clienteId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listarNiveisDaOrg(orgId: string): Promise<Nivel[]> {
  const { data, error } = await supabaseAdmin
    .from("niveis")
    .select("*")
    .eq("org_id", orgId)
    .order("numero", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listarAgendamentosDoCliente(
  clienteId: string,
  limit = 20
): Promise<Agendamento[]> {
  const { data, error } = await supabaseAdmin
    .from("agendamentos")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("inicio", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listarFptsEventosDoCliente(
  clienteId: string,
  limit = 30
): Promise<FptsEvento[]> {
  const { data, error } = await supabaseAdmin
    .from("fpts_eventos")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listarBarbeirosDaOrg(orgId: string) {
  const { data, error } = await supabaseAdmin
    .from("barbeiros")
    .select("id, nome")
    .eq("org_id", orgId)
    .eq("ativo", true);
  if (error) throw error;
  return data ?? [];
}
