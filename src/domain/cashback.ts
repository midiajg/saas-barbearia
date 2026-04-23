/**
 * Cashback:
 * - Pontos acumulados (FPTS) viram saldo em reais pela regra `fpts_por_real`.
 *   Ex: fpts_por_real=100 → 100 FPTS = R$ 1,00. 800 FPTS = R$ 8,00.
 * - Cliente só pode abater até `max_pct_por_servico`% do valor do serviço.
 *   Ex: serviço R$ 60, limite 30% = R$ 18 de abate máximo.
 * - O resgate debita FPTS proporcionais ao valor abatido.
 */

export type CashbackConfig = {
  fptsPorReal: number;
  maxPctPorServico: number;
};

export function fptsParaReais(
  fpts: number,
  config: CashbackConfig
): number {
  if (config.fptsPorReal <= 0) return 0;
  return Math.floor((fpts / config.fptsPorReal) * 100) / 100;
}

export function reaisParaFpts(reais: number, config: CashbackConfig): number {
  return Math.ceil(reais * config.fptsPorReal);
}

export function calcularAbateMaximo(
  cashbackFpts: number,
  valorServico: number,
  config: CashbackConfig
): { reais: number; fpts: number } {
  const saldoReais = fptsParaReais(cashbackFpts, config);
  const limitePorServico =
    (valorServico * config.maxPctPorServico) / 100;
  const reaisAbatidos = Math.min(saldoReais, limitePorServico);
  const fptsDebitados = reaisParaFpts(reaisAbatidos, config);
  return {
    reais: Math.round(reaisAbatidos * 100) / 100,
    fpts: fptsDebitados,
  };
}

export function aplicarResgate(
  valorBase: number,
  usarCashback: boolean,
  cashbackFpts: number,
  config: CashbackConfig
): {
  valorFinal: number;
  reaisAbatidos: number;
  fptsDebitados: number;
} {
  if (!usarCashback || cashbackFpts <= 0) {
    return { valorFinal: valorBase, reaisAbatidos: 0, fptsDebitados: 0 };
  }
  const { reais, fpts } = calcularAbateMaximo(cashbackFpts, valorBase, config);
  return {
    valorFinal: Math.max(0, valorBase - reais),
    reaisAbatidos: reais,
    fptsDebitados: fpts,
  };
}
