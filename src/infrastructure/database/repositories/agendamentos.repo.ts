import { BaseRepo } from "./base";
import type {
  Agendamento,
  AgendamentoStatus,
  AgendamentoServicoItem,
} from "../types";

export class AgendamentosRepo extends BaseRepo {
  async listDoDia(data: Date): Promise<Agendamento[]> {
    const inicio = new Date(data);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(data);
    fim.setHours(23, 59, 59, 999);

    const { data: rows, error } = await this.sb
      .from("agendamentos")
      .select("*")
      .eq("org_id", this.orgId)
      .gte("inicio", inicio.toISOString())
      .lte("inicio", fim.toISOString())
      .order("inicio", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  }

  async get(id: string): Promise<Agendamento | null> {
    const { data, error } = await this.sb
      .from("agendamentos")
      .select("*")
      .eq("org_id", this.orgId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async create(input: {
    barbeiroId: string;
    clienteId?: string;
    inicio: Date;
    fim: Date;
    servicos?: AgendamentoServicoItem[];
    valorTotal?: string;
    observacoes?: string;
  }): Promise<Agendamento> {
    // Conflito com mesmo barbeiro (sobreposição: inicio < fim_novo AND fim > inicio_novo)
    const { data: conflito } = await this.sb
      .from("agendamentos")
      .select("id")
      .eq("org_id", this.orgId)
      .eq("barbeiro_id", input.barbeiroId)
      .neq("status", "cancelado")
      .lt("inicio", input.fim.toISOString())
      .gt("fim", input.inicio.toISOString())
      .limit(1);

    if (conflito && conflito.length > 0) {
      throw new Error("Horário em conflito com outro agendamento deste barbeiro");
    }

    const { data, error } = await this.sb
      .from("agendamentos")
      .insert({
        org_id: this.orgId,
        barbeiro_id: input.barbeiroId,
        cliente_id: input.clienteId,
        inicio: input.inicio.toISOString(),
        fim: input.fim.toISOString(),
        servicos: input.servicos,
        valor_total: input.valorTotal,
        observacoes: input.observacoes,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateStatus(
    id: string,
    status: AgendamentoStatus
  ): Promise<Agendamento> {
    const { data, error } = await this.sb
      .from("agendamentos")
      .update({ status })
      .eq("org_id", this.orgId)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async mover(id: string, novoInicio: Date, novoFim: Date) {
    const { data, error } = await this.sb
      .from("agendamentos")
      .update({
        inicio: novoInicio.toISOString(),
        fim: novoFim.toISOString(),
      })
      .eq("org_id", this.orgId)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async cancelar(id: string) {
    return this.updateStatus(id, "cancelado");
  }
}
