import type { PacoteAtivo, ServicoAtendido } from "@/infrastructure/database/types";

/**
 * Verifica se o pacote ativo está válido para usar agora.
 */
export function pacoteEstaAtivo(p: PacoteAtivo | null): boolean {
  if (!p) return false;
  const agora = new Date();
  if (new Date(p.fim) < agora) return false;
  if (p.usos_restantes !== null && p.usos_restantes <= 0) return false;
  return true;
}

/**
 * Quais serviços do atendimento são cobertos pelo pacote.
 * Se servicos_inclusos vazio = pacote cobre tudo.
 */
export function servicosCobertos(
  pacote: PacoteAtivo,
  servicos: ServicoAtendido[]
): ServicoAtendido[] {
  if (!pacoteEstaAtivo(pacote)) return [];
  if (pacote.servicos_inclusos.length === 0) return servicos;
  return servicos.filter((s) => pacote.servicos_inclusos.includes(s.id));
}

/**
 * Aplica o pacote nos serviços do atendimento.
 * Retorna serviços com preço zerado nos cobertos + total descontado + usos a debitar.
 */
export function aplicarPacoteEmServicos(
  pacote: PacoteAtivo | null,
  servicos: ServicoAtendido[]
): {
  servicos: ServicoAtendido[];
  descontoPacote: number;
  servicosUsadosCount: number;
} {
  if (!pacote || !pacoteEstaAtivo(pacote)) {
    return { servicos, descontoPacote: 0, servicosUsadosCount: 0 };
  }

  const cobertosIds = new Set(
    servicosCobertos(pacote, servicos).map((s) => s.id)
  );

  // Quantidade limitada: cobre apenas X serviços (do mais caro pro mais barato)
  let cobreAteN: number;
  if (pacote.usos_restantes === null) {
    cobreAteN = servicos.length;
  } else {
    cobreAteN = Math.min(pacote.usos_restantes, cobertosIds.size);
  }

  const candidatos = servicos
    .filter((s) => cobertosIds.has(s.id))
    .sort((a, b) => b.preco - a.preco)
    .slice(0, cobreAteN);
  const aplicarIds = new Set(candidatos.map((s) => s.id));

  let descontoPacote = 0;
  const novos = servicos.map((s) => {
    if (!aplicarIds.has(s.id)) return s;
    descontoPacote += s.preco;
    return { ...s, preco: 0 };
  });

  return {
    servicos: novos,
    descontoPacote,
    servicosUsadosCount: aplicarIds.size,
  };
}
