import { BaseRepo } from "./base";
import type { Horario, Feriado } from "../types";

export class HorariosRepo extends BaseRepo {
  async listSemana(): Promise<Horario[]> {
    const { data, error } = await this.sb
      .from("horarios")
      .select("*")
      .eq("org_id", this.orgId)
      .order("dia_semana", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async upsertDia(input: {
    diaSemana: number;
    abertura: string;
    fechamento: string;
    ativo: boolean;
  }): Promise<Horario> {
    const { data: existing } = await this.sb
      .from("horarios")
      .select("id")
      .eq("org_id", this.orgId)
      .eq("dia_semana", input.diaSemana)
      .maybeSingle();

    if (existing) {
      const { data, error } = await this.sb
        .from("horarios")
        .update({
          abertura: input.abertura,
          fechamento: input.fechamento,
          ativo: input.ativo,
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await this.sb
      .from("horarios")
      .insert({
        org_id: this.orgId,
        dia_semana: input.diaSemana,
        abertura: input.abertura,
        fechamento: input.fechamento,
        ativo: input.ativo,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async listFeriados(): Promise<Feriado[]> {
    const { data, error } = await this.sb
      .from("feriados")
      .select("*")
      .eq("org_id", this.orgId)
      .order("data", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async addFeriado(input: { data: string; descricao: string }): Promise<Feriado> {
    const { data, error } = await this.sb
      .from("feriados")
      .insert({ org_id: this.orgId, ...input })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async removeFeriado(id: string): Promise<void> {
    const { error } = await this.sb
      .from("feriados")
      .delete()
      .eq("org_id", this.orgId)
      .eq("id", id);
    if (error) throw error;
  }
}
