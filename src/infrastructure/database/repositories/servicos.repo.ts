import { BaseRepo } from "./base";
import type { Servico } from "../types";

export class ServicosRepo extends BaseRepo {
  async list(opts: { ativosOnly?: boolean } = {}): Promise<Servico[]> {
    let q = this.sb
      .from("servicos")
      .select("*")
      .eq("org_id", this.orgId)
      .order("nome", { ascending: true });
    if (opts.ativosOnly) q = q.eq("ativo", true);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  }

  async get(id: string): Promise<Servico | null> {
    const { data, error } = await this.sb
      .from("servicos")
      .select("*")
      .eq("org_id", this.orgId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async create(input: {
    nome: string;
    descricao?: string;
    duracaoMin: number;
    precoQuinzenal: string;
    precoMensal: string;
    precoEventual: string;
  }): Promise<Servico> {
    const { data, error } = await this.sb
      .from("servicos")
      .insert({
        org_id: this.orgId,
        nome: input.nome,
        descricao: input.descricao,
        duracao_min: input.duracaoMin,
        preco_quinzenal: input.precoQuinzenal,
        preco_mensal: input.precoMensal,
        preco_eventual: input.precoEventual,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(
    id: string,
    input: Partial<{
      nome: string;
      descricao: string | null;
      duracao_min: number;
      preco_quinzenal: string;
      preco_mensal: string;
      preco_eventual: string;
      ativo: boolean;
    }>
  ): Promise<Servico> {
    const { data, error } = await this.sb
      .from("servicos")
      .update(input)
      .eq("org_id", this.orgId)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
