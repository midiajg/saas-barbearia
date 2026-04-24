import { BaseRepo } from "./base";
import { TABELAS } from "@/infrastructure/database/tabelas";
import type {
  Cliente,
  DadosPessoais,
  EventoFpts,
  Nivel,
  TipoEventoFpts,
} from "../types";
import { nivelAtual } from "@/domain/fpts";

export class ClientesRepo extends BaseRepo {
  async list(opts: { search?: string; limit?: number } = {}): Promise<Cliente[]> {
    const limit = opts.limit ?? 200;
    let q = this.sb
      .from(TABELAS.clientes)
      .select("*")
      .eq("barbearia_id", this.barbeariaId)
      .order("nome", { ascending: true })
      .limit(limit);
    if (opts.search) {
      const s = opts.search.replace(/[%_]/g, "");
      q = q.or(`nome.ilike.%${s}%,telefone.ilike.%${s}%`);
    }
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  }

  async get(id: string): Promise<Cliente | null> {
    const { data, error } = await this.sb
      .from(TABELAS.clientes)
      .select("*")
      .eq("barbearia_id", this.barbeariaId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async criar(input: {
    nome: string;
    telefone?: string;
    email?: string;
    dadosPessoais?: DadosPessoais;
  }): Promise<Cliente> {
    const { data, error } = await this.sb
      .from(TABELAS.clientes)
      .insert({
        barbearia_id: this.barbeariaId,
        nome: input.nome,
        telefone: input.telefone,
        email: input.email,
        dados_pessoais: input.dadosPessoais ?? null,
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
      telefone: string | null;
      email: string | null;
      foto_url: string | null;
      dados_pessoais: DadosPessoais | null;
    }>
  ): Promise<Cliente> {
    const { data, error } = await this.sb
      .from(TABELAS.clientes)
      .update(input)
      .eq("barbearia_id", this.barbeariaId)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async registrarEvento(
    clienteId: string,
    input: { tipo: TipoEventoFpts; pontos: number; descricao?: string },
    niveis: Nivel[]
  ): Promise<Cliente> {
    const cliente = await this.get(clienteId);
    if (!cliente) throw new Error("Cliente não encontrado");

    const evento: EventoFpts = {
      tipo: input.tipo,
      pontos: input.pontos,
      descricao: input.descricao,
      data: new Date().toISOString(),
    };

    const eventos = [...cliente.eventos_fpts, evento];
    const isResgate = input.tipo === "resgate";
    // FPTS total histórico nunca cai por resgate (nível preservado)
    const novoFpts = cliente.fpts + (isResgate ? 0 : input.pontos);
    const novoCashback = Math.max(0, cliente.cashback_fpts + input.pontos);
    const nv = nivelAtual(novoFpts, niveis);

    const { data, error } = await this.sb
      .from(TABELAS.clientes)
      .update({
        fpts: novoFpts,
        cashback_fpts: novoCashback,
        eventos_fpts: eventos,
      })
      .eq("barbearia_id", this.barbeariaId)
      .eq("id", clienteId)
      .select()
      .single();
    if (error) throw error;
    // nv usado só pra referência UI — aqui não persiste nivel_id (derivado)
    void nv;
    return data;
  }

  async atualizarUltimaVisita(id: string, data: Date): Promise<void> {
    const { error } = await this.sb
      .from(TABELAS.clientes)
      .update({ ultima_visita: data.toISOString() })
      .eq("barbearia_id", this.barbeariaId)
      .eq("id", id);
    if (error) throw error;
  }

  async deletar(id: string): Promise<void> {
    const { error } = await this.sb
      .from(TABELAS.clientes)
      .delete()
      .eq("barbearia_id", this.barbeariaId)
      .eq("id", id);
    if (error) throw error;
  }
}
