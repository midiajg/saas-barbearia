import { BaseRepo } from "./base";
import type { FormaPagamento, Pagamento } from "../types";

export class PagamentosRepo extends BaseRepo {
  async criar(input: {
    agendamentoId?: string;
    valor: string;
    forma: FormaPagamento;
  }): Promise<Pagamento> {
    const { data, error } = await this.sb
      .from("pagamentos")
      .insert({
        org_id: this.orgId,
        agendamento_id: input.agendamentoId,
        valor: input.valor,
        forma: input.forma,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async listarPorPeriodo(inicio: Date, fim: Date): Promise<Pagamento[]> {
    const { data, error } = await this.sb
      .from("pagamentos")
      .select("*")
      .eq("org_id", this.orgId)
      .gte("recebido_em", inicio.toISOString())
      .lte("recebido_em", fim.toISOString())
      .order("recebido_em", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
}
