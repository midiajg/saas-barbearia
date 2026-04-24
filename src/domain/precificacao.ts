import { diasDesde } from "@/lib/utils";
import type { CatalogoServico } from "@/infrastructure/database/types";

export type Frequencia = "quinzenal" | "mensal" | "eventual";

export function classificarFrequencia(ultimaVisita: Date | null): Frequencia {
  if (!ultimaVisita) return "eventual";
  const dias = diasDesde(ultimaVisita);
  if (dias <= 20) return "quinzenal";
  if (dias <= 45) return "mensal";
  return "eventual";
}

export function precoParaFrequencia(
  servico: CatalogoServico,
  freq: Frequencia
): number {
  if (freq === "quinzenal") return servico.preco_quinzenal;
  if (freq === "mensal") return servico.preco_mensal;
  return servico.preco_eventual;
}

export function calcularPreco(
  servico: CatalogoServico,
  ultimaVisita: Date | null
): { preco: number; frequencia: Frequencia } {
  const frequencia = classificarFrequencia(ultimaVisita);
  return { preco: precoParaFrequencia(servico, frequencia), frequencia };
}
