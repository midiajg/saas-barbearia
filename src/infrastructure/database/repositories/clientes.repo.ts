import { BaseRepo } from "./base";
import type { Cliente, ClienteNota, FptsEventoTipo, Nivel } from "../types";

export class ClientesRepo extends BaseRepo {
  async list(opts: { search?: string; limit?: number } = {}): Promise<Cliente[]> {
    const limit = opts.limit ?? 50;
    let q = this.sb
      .from("clientes")
      .select("*")
      .eq("org_id", this.orgId)
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
      .from("clientes")
      .select("*")
      .eq("org_id", this.orgId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async create(input: {
    nome: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    aniversario?: string;
    filhos?: string;
    profissao?: string;
    hobby?: string;
    foto_url?: string;
  }): Promise<Cliente> {
    const { data, error } = await this.sb
      .from("clientes")
      .insert({ org_id: this.orgId, ...input })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(
    id: string,
    input: Partial<{
      nome: string;
      telefone: string | null;
      email: string | null;
      endereco: string | null;
      aniversario: string | null;
      filhos: string | null;
      profissao: string | null;
      hobby: string | null;
      foto_url: string | null;
    }>
  ): Promise<Cliente> {
    const { data, error } = await this.sb
      .from("clientes")
      .update(input)
      .eq("org_id", this.orgId)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async listNotas(clienteId: string, limit = 20): Promise<ClienteNota[]> {
    const { data, error } = await this.sb
      .from("cliente_notas")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("criado_em", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  async addNota(
    clienteId: string,
    texto: string,
    autorUserId?: string
  ): Promise<ClienteNota> {
    const { data, error } = await this.sb
      .from("cliente_notas")
      .insert({
        cliente_id: clienteId,
        autor_user_id: autorUserId,
        texto,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async addFptsEvento(input: {
    clienteId: string;
    tipo: FptsEventoTipo;
    pontos: number;
    descricao?: string;
  }) {
    const { data: evento, error: evErr } = await this.sb
      .from("fpts_eventos")
      .insert({
        org_id: this.orgId,
        cliente_id: input.clienteId,
        tipo: input.tipo,
        pontos: input.pontos,
        descricao: input.descricao,
      })
      .select()
      .single();
    if (evErr) throw evErr;

    const { data: cliAtual } = await this.sb
      .from("clientes")
      .select("fpts, cashback_fpts")
      .eq("id", input.clienteId)
      .single();

    const isResgate = input.tipo === "resgate";
    const delta = input.pontos;
    const novoFpts = (cliAtual?.fpts ?? 0) + (isResgate ? 0 : delta);
    const novoCashback = Math.max(0, (cliAtual?.cashback_fpts ?? 0) + delta);

    // Recalcula nível pelo total histórico (FPTS nunca cai por resgate)
    const { data: niveis } = await this.sb
      .from("niveis")
      .select("*")
      .eq("org_id", this.orgId)
      .order("min_fpts", { ascending: false });
    const novoNivel: Nivel | undefined = (niveis as Nivel[] | null)?.find(
      (n) => novoFpts >= n.min_fpts
    );

    await this.sb
      .from("clientes")
      .update({
        fpts: novoFpts,
        cashback_fpts: novoCashback,
        nivel_id: novoNivel?.id ?? null,
      })
      .eq("org_id", this.orgId)
      .eq("id", input.clienteId);

    return evento;
  }

  async atualizarUltimaVisita(clienteId: string, data: Date) {
    const { error } = await this.sb
      .from("clientes")
      .update({ ultima_visita: data.toISOString() })
      .eq("org_id", this.orgId)
      .eq("id", clienteId);
    if (error) throw error;
  }

  async ultimaVisitaConcluida(clienteId: string): Promise<Date | null> {
    const { data } = await this.sb
      .from("agendamentos")
      .select("inicio")
      .eq("org_id", this.orgId)
      .eq("cliente_id", clienteId)
      .eq("status", "realizado")
      .order("inicio", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.inicio ? new Date(data.inicio) : null;
  }
}
