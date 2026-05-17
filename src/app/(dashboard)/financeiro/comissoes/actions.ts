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
  custoMaterial: number; // somatório dos custos de material descontados
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

  // Comissão é calculada por linha (serviço/produto) pra suportar custo de
  // material por serviço e comissão override por produto.
  const acc = new Map<
    string,
    { qtd: number; fat: number; custo: number; comissao: number }
  >();
  for (const a of realizados) {
    const barbeiro = equipe.find((b) => b.id === a.barbeiro_id);
    const pctBarbeiro = barbeiro
      ? Number.parseFloat(barbeiro.comissao_pct)
      : 0;

    const valorPago = Number.parseFloat(a.valor_pago ?? a.valor_total ?? "0");
    if (valorPago <= 0) continue;

    let custoMaterial = 0;
    let comissaoAtendimento = 0;

    const servicos = a.servicos ?? [];
    let baseServicos = 0;
    for (const s of servicos) {
      const cm = s.custo_material ?? 0;
      custoMaterial += cm;
      baseServicos += Math.max(0, s.preco - cm);
    }
    comissaoAtendimento += baseServicos * pctBarbeiro;

    const produtos = a.produtos ?? [];
    for (const p of produtos) {
      const totalLinha = p.preco * p.qtd;
      if (p.comissao && p.comissao.valor > 0) {
        comissaoAtendimento +=
          p.comissao.tipo === "percentual"
            ? totalLinha * (p.comissao.valor / 100)
            : p.comissao.valor * p.qtd;
      } else {
        comissaoAtendimento += totalLinha * pctBarbeiro;
      }
    }

    const prev = acc.get(a.barbeiro_id) ?? {
      qtd: 0,
      fat: 0,
      custo: 0,
      comissao: 0,
    };
    prev.qtd += 1;
    prev.fat += valorPago;
    prev.custo += custoMaterial;
    prev.comissao += comissaoAtendimento;
    acc.set(a.barbeiro_id, prev);
  }

  // Barbeiro só vê a linha dele.
  const equipeVisivel =
    session.cargo === "barbeiro"
      ? equipe.filter((b) => b.id === session.equipeId)
      : equipe;

  return equipeVisivel.map((b) => {
    const d = acc.get(b.id) ?? { qtd: 0, fat: 0, custo: 0, comissao: 0 };
    const pct = Number.parseFloat(b.comissao_pct);
    return {
      barbeiroId: b.id,
      barbeiroNome: b.nome,
      percentualComissao: pct,
      qtdAtendimentos: d.qtd,
      faturamentoBruto: Math.round(d.fat * 100) / 100,
      custoMaterial: Math.round(d.custo * 100) / 100,
      valorComissao: Math.round(d.comissao * 100) / 100,
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
    "% Comissão padrão",
    "Atendimentos",
    "Faturamento bruto (R$)",
    "Custo material (R$)",
    "Comissão (R$)",
  ].join(";");
  const corpo = linhas
    .map((l) =>
      [
        l.barbeiroNome,
        l.percentualComissao.toFixed(2),
        l.qtdAtendimentos,
        l.faturamentoBruto.toFixed(2),
        l.custoMaterial.toFixed(2),
        l.valorComissao.toFixed(2),
      ].join(";")
    )
    .join("\n");
  return `${cab}\n${corpo}`;
}
