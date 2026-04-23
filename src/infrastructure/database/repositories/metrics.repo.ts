import { BaseRepo } from "./base";

export class MetricsRepo extends BaseRepo {
  async agendamentosHoje(): Promise<number> {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date();
    fim.setHours(23, 59, 59, 999);
    const { count, error } = await this.sb
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("org_id", this.orgId)
      .gte("inicio", inicio.toISOString())
      .lte("inicio", fim.toISOString())
      .neq("status", "cancelado");
    if (error) throw error;
    return count ?? 0;
  }

  async faturamentoMes(): Promise<number> {
    const agora = new Date();
    const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fim = new Date(
      agora.getFullYear(),
      agora.getMonth() + 1,
      0,
      23,
      59,
      59
    );
    const { data, error } = await this.sb
      .from("pagamentos")
      .select("valor")
      .eq("org_id", this.orgId)
      .gte("recebido_em", inicio.toISOString())
      .lte("recebido_em", fim.toISOString());
    if (error) throw error;
    return (data ?? []).reduce((acc, p) => acc + Number(p.valor), 0);
  }

  async ticketMedioMes(): Promise<{ ticket: number; qtd: number }> {
    const agora = new Date();
    const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fim = new Date(
      agora.getFullYear(),
      agora.getMonth() + 1,
      0,
      23,
      59,
      59
    );
    const { data, error } = await this.sb
      .from("pagamentos")
      .select("valor")
      .eq("org_id", this.orgId)
      .gte("recebido_em", inicio.toISOString())
      .lte("recebido_em", fim.toISOString());
    if (error) throw error;
    const qtd = data?.length ?? 0;
    const total = (data ?? []).reduce((acc, p) => acc + Number(p.valor), 0);
    return { ticket: qtd > 0 ? total / qtd : 0, qtd };
  }

  async clientesAtivos(diasJanela = 60): Promise<number> {
    const limite = new Date();
    limite.setDate(limite.getDate() - diasJanela);
    const { count, error } = await this.sb
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("org_id", this.orgId)
      .gte("ultima_visita", limite.toISOString());
    if (error) throw error;
    return count ?? 0;
  }

  async proximosAgendamentos(limit = 5) {
    const agora = new Date();
    const { data, error } = await this.sb
      .from("agendamentos")
      .select("id, inicio, status, barbeiro_id, cliente_id, valor_total")
      .eq("org_id", this.orgId)
      .gte("inicio", agora.toISOString())
      .neq("status", "cancelado")
      .order("inicio", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  async clientesInativos(
    diasCorte = 30,
    limit = 5
  ): Promise<Array<{ id: string; nome: string; ultima_visita: string | null }>> {
    const corte = new Date();
    corte.setDate(corte.getDate() - diasCorte);
    const { data, error } = await this.sb
      .from("clientes")
      .select("id, nome, ultima_visita")
      .eq("org_id", this.orgId)
      .not("ultima_visita", "is", null)
      .lt("ultima_visita", corte.toISOString())
      .order("ultima_visita", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }
}
