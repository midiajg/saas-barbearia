import type { CashbackRegra } from "@/infrastructure/database/types";

export function fptsParaReais(fpts: number, regra: CashbackRegra): number {
  if (regra.fpts_por_real <= 0) return 0;
  return Math.floor((fpts / regra.fpts_por_real) * 100) / 100;
}

export function reaisParaFpts(reais: number, regra: CashbackRegra): number {
  return Math.ceil(reais * regra.fpts_por_real);
}

export function calcularAbateMaximo(
  cashbackFpts: number,
  valorServico: number,
  regra: CashbackRegra
): { reais: number; fpts: number } {
  if (cashbackFpts <= 0 || valorServico <= 0) return { reais: 0, fpts: 0 };
  const saldoReais = fptsParaReais(cashbackFpts, regra);
  const limite = (valorServico * regra.max_pct) / 100;
  const reais = Math.min(saldoReais, limite);
  const fpts = reaisParaFpts(reais, regra);
  return { reais: Math.round(reais * 100) / 100, fpts };
}

export function aplicarResgate(
  valorBase: number,
  usarCashback: boolean,
  cashbackFpts: number,
  regra: CashbackRegra
): { reaisAbatidos: number; fptsDebitados: number; valorFinal: number } {
  if (!usarCashback || cashbackFpts <= 0) {
    return { reaisAbatidos: 0, fptsDebitados: 0, valorFinal: valorBase };
  }
  const { reais, fpts } = calcularAbateMaximo(cashbackFpts, valorBase, regra);
  return {
    reaisAbatidos: reais,
    fptsDebitados: fpts,
    valorFinal: Math.max(0, valorBase - reais),
  };
}
