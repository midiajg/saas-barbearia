import { supabaseAdmin } from "@/infrastructure/database/client";
import { TABELAS } from "@/infrastructure/database/tabelas";
import { BaseRepo } from "./base";
import type { Cargo, Equipe } from "../types";

export async function buscarEquipePorEmail(
  email: string
): Promise<Equipe | null> {
  const { data, error } = await supabaseAdmin
    .from(TABELAS.equipe)
    .select("*")
    .eq("email", email)
    .eq("ativo", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export class EquipeRepo extends BaseRepo {
  async list(opts: { ativosOnly?: boolean } = {}): Promise<Equipe[]> {
    let q = this.sb
      .from(TABELAS.equipe)
      .select("*")
      .eq("barbearia_id", this.barbeariaId)
      .order("nome", { ascending: true });
    if (opts.ativosOnly) q = q.eq("ativo", true);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  }

  async get(id: string): Promise<Equipe | null> {
    const { data, error } = await this.sb
      .from(TABELAS.equipe)
      .select("*")
      .eq("barbearia_id", this.barbeariaId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async criar(input: {
    nome: string;
    email: string;
    senhaHash: string;
    cargo: Cargo;
    fotoUrl?: string;
    cor?: string;
    comissaoPct?: number;
  }): Promise<Equipe> {
    const { data, error } = await this.sb
      .from(TABELAS.equipe)
      .insert({
        barbearia_id: this.barbeariaId,
        nome: input.nome,
        email: input.email,
        senha_hash: input.senhaHash,
        cargo: input.cargo,
        foto_url: input.fotoUrl,
        cor: input.cor ?? "#45D4C0",
        comissao_pct: input.comissaoPct ?? 50,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async atualizar(
    id: string,
    input: Partial<{
      nome: string;
      email: string;
      cargo: Cargo;
      foto_url: string | null;
      cor: string;
      comissao_pct: number;
      ativo: boolean;
    }>
  ): Promise<Equipe> {
    const { data, error } = await this.sb
      .from(TABELAS.equipe)
      .update(input)
      .eq("barbearia_id", this.barbeariaId)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async atualizarSenha(id: string, senhaHash: string): Promise<void> {
    const { error } = await this.sb
      .from(TABELAS.equipe)
      .update({ senha_hash: senhaHash })
      .eq("barbearia_id", this.barbeariaId)
      .eq("id", id);
    if (error) throw error;
  }
}
