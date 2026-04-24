"use server";

import { requireSession } from "@/lib/auth/session";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import { EquipeRepo } from "@/infrastructure/database/repositories/equipe.repo";

export type ComissaoLinha = {
  barbeiroId: string;
  barbeiroNome: string;
  percentualComissao: number;
  qtdAtendimentos: number;
  faturamentoBruto: number;
  valorComissao: number;
};

export async function comissoesPorPeriodo(
  deISO: string,
  ateISO: string
): Promise<ComissaoLinha[]> {
  const session = await requireSession();
  const de = new Date(deISO);
  const ate = new Date(ateISO);

  const atRepo = new AtendimentosRepo(session.barbeariaId);
  const equipeRepo = new EquipeRepo(session.barbeariaId);

  const [atendimentos, equipe] = await Promise.all([
    atRepo.listPorPeriodo(de, ate),
    equipeRepo.list(),
  ]);
  const realizados = atendimentos.filter((a) => a.status === "realizado");

  const acc = new Map<string, { qtd: number; fat: number }>();
  for (const a of realizados) {
    const valor = Number.parseFloat(a.valor_pago ?? a.valor_total ?? "0");
    if (valor <= 0) continue;
    const prev = acc.get(a.barbeiro_id) ?? { qtd: 0, fat: 0 };
    prev.qtd += 1;
    prev.fat += valor;
    acc.set(a.barbeiro_id, prev);
  }

  return equipe.map((b) => {
    const d = acc.get(b.id) ?? { qtd: 0, fat: 0 };
    const pct = Number.parseFloat(b.comissao_pct);
    return {
      barbeiroId: b.id,
      barbeiroNome: b.nome,
      percentualComissao: pct,
      qtdAtendimentos: d.qtd,
      faturamentoBruto: Math.round(d.fat * 100) / 100,
      valorComissao: Math.round(d.fat * pct) / 100,
    };
  });
}

export async function exportarCsvComissoes(
  deISO: string,
  ateISO: string
): Promise<string> {
  const linhas = await comissoesPorPeriodo(deISO, ateISO);
  const cab = [
    "Barbeiro",
    "% Comissão",
    "Atendimentos",
    "Faturamento bruto (R$)",
    "Comissão (R$)",
  ].join(";");
  const corpo = linhas
    .map((l) =>
      [
        l.barbeiroNome,
        l.percentualComissao.toFixed(2),
        l.qtdAtendimentos,
        l.faturamentoBruto.toFixed(2),
        l.valorComissao.toFixed(2),
      ].join(";")
    )
    .join("\n");
  return `${cab}\n${corpo}`;
}
