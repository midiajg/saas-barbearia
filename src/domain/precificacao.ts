/**
 * Precificação por frequência:
 * - quinzenal: <= 20 dias desde a última visita realizada
 * - mensal: <= 45 dias
 * - eventual: > 45 dias OU sem histórico
 *
 * Pure function — nunca persistir, sempre derivar da última visita.
 */

import { diasDesde } from "@/lib/utils";

export type Frequencia = "quinzenal" | "mensal" | "eventual";

export type PrecoServico = {
  precoQuinzenal: string;
  precoMensal: string;
  precoEventual: string;
};

export function classificarFrequencia(ultimaVisita: Date | null): Frequencia {
  if (!ultimaVisita) return "eventual";
  const dias = diasDesde(ultimaVisita);
  if (dias <= 20) return "quinzenal";
  if (dias <= 45) return "mensal";
  return "eventual";
}

export function precoParaFrequencia(
  servico: PrecoServico,
  freq: Frequencia
): number {
  const campo: Record<Frequencia, keyof PrecoServico> = {
    quinzenal: "precoQuinzenal",
    mensal: "precoMensal",
    eventual: "precoEventual",
  };
  return Number.parseFloat(servico[campo[freq]]);
}

export function calcularPreco(
  servico: PrecoServico,
  ultimaVisita: Date | null
): { preco: number; frequencia: Frequencia } {
  const frequencia = classificarFrequencia(ultimaVisita);
  return { preco: precoParaFrequencia(servico, frequencia), frequencia };
}

export function aplicarDescontoNivel(
  precoBase: number,
  descontoPercentual: number | undefined | null
): number {
  if (!descontoPercentual || descontoPercentual <= 0) return precoBase;
  const desconto = (precoBase * descontoPercentual) / 100;
  return Math.max(0, precoBase - desconto);
}
