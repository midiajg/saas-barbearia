import { requireSession } from "@/lib/auth/session";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { EquipeRepo } from "@/infrastructure/database/repositories/equipe.repo";
import { RelatoriosClient } from "./relatorios-client";
import type { FormaPagamento } from "@/infrastructure/database/types";

function isoDia(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const agora = new Date();
  const inicio30d = new Date(agora);
  inicio30d.setDate(inicio30d.getDate() - 30);

  const deISO = params.de ?? isoDia(inicio30d);
  const ateISO = params.ate ?? isoDia(agora);

  const de = new Date(deISO + "T00:00:00");
  const ate = new Date(ateISO + "T23:59:59");

  const atRepo = new AtendimentosRepo(session.barbeariaId);
  const clientesRepo = new ClientesRepo(session.barbeariaId);
  const equipeRepo = new EquipeRepo(session.barbeariaId);

  const [atendimentos, clientes, equipe] = await Promise.all([
    atRepo.listPorPeriodo(de, ate),
    clientesRepo.list({ limit: 500 }),
    equipeRepo.list(),
  ]);
  const realizados = atendimentos.filter((a) => a.status === "realizado");

  // Ticket + KPIs
  const total = realizados.reduce(
    (s, a) => s + Number.parseFloat(a.valor_pago ?? "0"),
    0
  );
  const qtd = realizados.length;
  const ticket = qtd > 0 ? Math.round((total / qtd) * 100) / 100 : 0;

  // Faturamento por dia
  const mapaFat = new Map<string, number>();
  for (
    let d = new Date(de);
    d.getTime() <= ate.getTime();
    d.setDate(d.getDate() + 1)
  ) {
    mapaFat.set(isoDia(d), 0);
  }
  for (const a of realizados) {
    const dia = isoDia(new Date(a.inicio));
    mapaFat.set(
      dia,
      (mapaFat.get(dia) ?? 0) + Number.parseFloat(a.valor_pago ?? "0")
    );
  }
  const faturamentoPorDia = Array.from(mapaFat.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, valor]) => ({ data, valor: Math.round(valor * 100) / 100 }));

  // Top clientes
  const clientesMap = new Map(clientes.map((c) => [c.id, c.nome]));
  const accC = new Map<string, { visitas: number; total: number }>();
  for (const a of realizados) {
    if (!a.cliente_id) continue;
    const v = accC.get(a.cliente_id) ?? { visitas: 0, total: 0 };
    v.visitas += 1;
    v.total += Number.parseFloat(a.valor_pago ?? "0");
    accC.set(a.cliente_id, v);
  }
  const topClientes = Array.from(accC.entries())
    .map(([clienteId, v]) => ({
      clienteId,
      nome: clientesMap.get(clienteId) ?? "Cliente",
      visitas: v.visitas,
      total: Math.round(v.total * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Top barbeiros
  const equipeMap = new Map(equipe.map((b) => [b.id, b.nome]));
  const accB = new Map<string, { qtd: number; fat: number }>();
  for (const a of realizados) {
    const v = accB.get(a.barbeiro_id) ?? { qtd: 0, fat: 0 };
    v.qtd += 1;
    v.fat += Number.parseFloat(a.valor_pago ?? "0");
    accB.set(a.barbeiro_id, v);
  }
  const topBarbeiros = Array.from(accB.entries())
    .map(([barbeiroId, v]) => ({
      barbeiroId,
      nome: equipeMap.get(barbeiroId) ?? "Barbeiro",
      atendimentos: v.qtd,
      faturamento: Math.round(v.fat * 100) / 100,
    }))
    .sort((a, b) => b.faturamento - a.faturamento);

  // Formas de pagamento
  const accF = new Map<FormaPagamento, number>();
  for (const a of realizados) {
    if (!a.forma_pagamento) continue;
    accF.set(
      a.forma_pagamento,
      (accF.get(a.forma_pagamento) ?? 0) + Number.parseFloat(a.valor_pago ?? "0")
    );
  }
  const formasPagamento = Array.from(accF.entries()).map(([forma, valor]) => ({
    forma,
    valor: Math.round(valor * 100) / 100,
  }));

  // Inativos 30+
  const agoraT = Date.now();
  const corte = new Date();
  corte.setDate(corte.getDate() - 30);
  const inativos = clientes
    .filter(
      (c) => c.ultima_visita && new Date(c.ultima_visita) < corte
    )
    .sort(
      (a, b) =>
        new Date(a.ultima_visita!).getTime() -
        new Date(b.ultima_visita!).getTime()
    )
    .slice(0, 20)
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      diasSemVisita: Math.floor(
        (agoraT - new Date(c.ultima_visita!).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

  return (
    <RelatoriosClient
      deInicial={deISO}
      ateInicial={ateISO}
      ticket={ticket}
      qtdAtendimentos={qtd}
      totalPeriodo={Math.round(total * 100) / 100}
      faturamentoPorDia={faturamentoPorDia}
      topClientes={topClientes}
      topBarbeiros={topBarbeiros}
      formasPagamento={formasPagamento}
      clientesInativos={inativos}
    />
  );
}
