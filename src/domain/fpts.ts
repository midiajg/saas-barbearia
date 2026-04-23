import type { Nivel } from "@/infrastructure/database/schema";

export const FPTS_REGRAS = {
  google: 500,
  indicacao: 500,
  instagram: 300,
  pontualidade: 100,
  aniversario: 200,
} as const;

export function nivelAtual(fpts: number, niveis: Nivel[]): Nivel | null {
  const ordenados = [...niveis].sort((a, b) => b.minFpts - a.minFpts);
  return ordenados.find((n) => fpts >= n.minFpts) ?? null;
}

export function proximoNivel(
  fpts: number,
  niveis: Nivel[]
): { nivel: Nivel; faltam: number } | null {
  const ordenados = [...niveis].sort((a, b) => a.minFpts - b.minFpts);
  const proximo = ordenados.find((n) => n.minFpts > fpts);
  if (!proximo) return null;
  return { nivel: proximo, faltam: proximo.minFpts - fpts };
}
