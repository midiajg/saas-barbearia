import { BaseRepo } from "./base";
import type { Barbeiro, Servico } from "../types";

export class BarbeirosRepo extends BaseRepo {
  async list(opts: { ativosOnly?: boolean } = {}): Promise<Barbeiro[]> {
    let q = this.sb
      .from("barbeiros")
      .select("*")
      .eq("org_id", this.orgId)
      .order("ativo", { ascending: false })
      .order("nome", { ascending: true });
    if (opts.ativosOnly) q = q.eq("ativo", true);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  }

  async get(id: string): Promise<Barbeiro | null> {
    const { data, error } = await this.sb
      .from("barbeiros")
      .select("*")
      .eq("org_id", this.orgId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async create(input: {
    nome: string;
    fotoUrl?: string;
    cor?: string;
    percentualComissao?: string;
  }): Promise<Barbeiro> {
    const { data, error } = await this.sb
      .from("barbeiros")
      .insert({
        org_id: this.orgId,
        nome: input.nome,
        foto_url: input.fotoUrl,
        cor: input.cor ?? "#45D4C0",
        percentual_comissao: input.percentualComissao ?? "50.00",
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
      foto_url: string | null;
      cor: string;
      percentual_comissao: string;
      ativo: boolean;
    }>
  ): Promise<Barbeiro> {
    const { data, error } = await this.sb
      .from("barbeiros")
      .update(input)
      .eq("org_id", this.orgId)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async setServicos(barbeiroId: string, servicoIds: string[]): Promise<void> {
    await this.sb.from("barbeiro_servicos").delete().eq("barbeiro_id", barbeiroId);
    if (servicoIds.length > 0) {
      const rows = servicoIds.map((sid) => ({
        barbeiro_id: barbeiroId,
        servico_id: sid,
      }));
      const { error } = await this.sb.from("barbeiro_servicos").insert(rows);
      if (error) throw error;
    }
  }

  async listServicosDoBarbeiro(barbeiroId: string): Promise<Servico[]> {
    const { data, error } = await this.sb
      .from("barbeiro_servicos")
      .select("servicos(*)")
      .eq("barbeiro_id", barbeiroId);
    if (error) throw error;
    type Row = { servicos: Servico };
    return ((data as unknown as Row[]) ?? []).map((r) => r.servicos);
  }

  async getByUserId(userId: string) {
    const { data, error } = await this.sb
      .from("barbeiros")
      .select("*")
      .eq("org_id", this.orgId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
}
