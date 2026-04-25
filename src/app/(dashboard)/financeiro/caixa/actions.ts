"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import type {
  CaixaAberto,
  CaixaFechado,
  MovimentoCaixa,
} from "@/infrastructure/database/types";

export async function abrirCaixa(saldoInicial: number) {
  const session = await requireSession();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");
  if (barbearia.config.caixa_atual)
    throw new Error("Caixa já está aberto");

  const novo: CaixaAberto = {
    id: randomUUID(),
    aberto_em: new Date().toISOString(),
    aberto_por: session.equipeId,
    saldo_inicial: saldoInicial,
    movimentos: [],
  };
  await repo.atualizarConfig({ caixa_atual: novo });
  revalidatePath("/financeiro/caixa");
}

export async function lancarMovimento(input: {
  tipo: "sangria" | "suprimento" | "ajuste";
  valor: number;
  motivo?: string;
}) {
  const session = await requireSession();
  const data = z
    .object({
      tipo: z.enum(["sangria", "suprimento", "ajuste"]),
      valor: z.coerce.number().min(0.01),
      motivo: z.string().optional(),
    })
    .parse(input);

  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia?.config.caixa_atual)
    throw new Error("Nenhum caixa aberto");

  const mov: MovimentoCaixa = {
    id: randomUUID(),
    tipo: data.tipo,
    valor: data.valor,
    motivo: data.motivo,
    hora: new Date().toISOString(),
  };

  await repo.atualizarConfig({
    caixa_atual: {
      ...barbearia.config.caixa_atual,
      movimentos: [...barbearia.config.caixa_atual.movimentos, mov],
    },
  });
  revalidatePath("/financeiro/caixa");
}

export async function fecharCaixa(contadoFisico: number) {
  const session = await requireSession();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const atRepo = new AtendimentosRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia?.config.caixa_atual)
    throw new Error("Nenhum caixa aberto");

  const aberto = barbearia.config.caixa_atual;

  // Soma de pagamentos em dinheiro do período de abertura até agora
  const inicio = new Date(aberto.aberto_em);
  const fim = new Date();
  const atendimentos = await atRepo.listPorPeriodo(inicio, fim);
  const recebidoSistema = atendimentos
    .filter(
      (a) => a.status === "realizado" && a.forma_pagamento === "dinheiro"
    )
    .reduce((s, a) => s + Number.parseFloat(a.valor_pago ?? "0"), 0);

  const totalSuprimentos = aberto.movimentos
    .filter((m) => m.tipo === "suprimento")
    .reduce((s, m) => s + m.valor, 0);
  const totalSangrias = aberto.movimentos
    .filter((m) => m.tipo === "sangria")
    .reduce((s, m) => s + m.valor, 0);
  const totalAjustes = aberto.movimentos
    .filter((m) => m.tipo === "ajuste")
    .reduce((s, m) => s + m.valor, 0);

  const esperado =
    aberto.saldo_inicial +
    recebidoSistema +
    totalSuprimentos -
    totalSangrias +
    totalAjustes;

  const diferenca = Math.round((contadoFisico - esperado) * 100) / 100;

  const fechado: CaixaFechado = {
    id: aberto.id,
    data: new Date(aberto.aberto_em).toISOString().slice(0, 10),
    aberto_em: aberto.aberto_em,
    fechado_em: fim.toISOString(),
    aberto_por: aberto.aberto_por,
    fechado_por: session.equipeId,
    saldo_inicial: aberto.saldo_inicial,
    movimentos: aberto.movimentos,
    recebido_sistema: Math.round(recebidoSistema * 100) / 100,
    contado_fisico: contadoFisico,
    diferenca,
  };

  await repo.atualizarConfig({
    caixa_atual: null,
    caixas_historico: [
      ...(barbearia.config.caixas_historico ?? []).slice(-29), // mantém últimos 30
      fechado,
    ],
  });
  revalidatePath("/financeiro/caixa");
}
