import { BaseRepo } from "./base";
import { TABELAS } from "@/infrastructure/database/tabelas";
import type {
  Atendimento,
  ServicoAtendido,
  StatusAtendimento,
} from "../types";

export class AtendimentosRepo extends BaseRepo {
  async listDoDia(data: Date): Promise<Atendimento[]> {
    const inicio = new Date(data);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(data);
    fim.setHours(23, 59, 59, 999);
    const { data: rows, error } = await this.sb
      .from(TABELAS.atendimentos)
      .select("*")
      .eq("barbearia_id", this.barbeariaId)
      .gte("inicio", inicio.toISOString())
      .lte("inicio", fim.toISOString())
      .order("inicio", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  }

  async listPorPeriodo(de: Date, ate: Date): Promise<Atendimento[]> {
    const { data, error } = await this.sb
      .from(TABELAS.atendimentos)
      .select("*")
      .eq("barbearia_id", this.barbeariaId)
      .gte("inicio", de.toISOString())
      .lte("inicio", ate.toISOString())
      .order("inicio", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async get(id: string): Promise<Atendimento | null> {
    const { data, error } = await this.sb
      .from(TABELAS.atendimentos)
      .select("*")
      .eq("barbearia_id", this.barbeariaId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async criar(input: {
    barbeiroId: string;
    clienteId?: string;
    inicio: Date;
    fim: Date;
    servicos?: ServicoAtendido[];
    valorTotal?: number;
    observacoes?: string;
  }): Promise<Atendimento> {
    const { data: conflito } = await this.sb
      .from(TABELAS.atendimentos)
      .select("id")
      .eq("barbearia_id", this.barbeariaId)
      .eq("barbeiro_id", input.barbeiroId)
      .neq("status", "cancelado")
      .lt("inicio", input.fim.toISOString())
      .gt("fim", input.inicio.toISOString())
      .limit(1);
    if (conflito && conflito.length > 0)
      throw new Error("Horário em conflito com outro atendimento deste barbeiro");

    const { data, error } = await this.sb
      .from(TABELAS.atendimentos)
      .insert({
        barbearia_id: this.barbeariaId,
        barbeiro_id: input.barbeiroId,
        cliente_id: input.clienteId,
        inicio: input.inicio.toISOString(),
        fim: input.fim.toISOString(),
        servicos: input.servicos,
        valor_total: input.valorTotal?.toFixed(2),
        observacoes: input.observacoes,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async mudarStatus(id: string, status: StatusAtendimento): Promise<void> {
    const { error } = await this.sb
      .from(TABELAS.atendimentos)
      .update({ status })
      .eq("barbearia_id", this.barbeariaId)
      .eq("id", id);
    if (error) throw error;
  }

  async mover(id: string, inicio: Date, fim: Date): Promise<void> {
    const { error } = await this.sb
      .from(TABELAS.atendimentos)
      .update({ inicio: inicio.toISOString(), fim: fim.toISOString() })
      .eq("barbearia_id", this.barbeariaId)
      .eq("id", id);
    if (error) throw error;
  }
}
