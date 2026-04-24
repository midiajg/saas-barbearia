import type { Nivel } from "@/infrastructure/database/types";

export function nivelAtual(fpts: number, niveis: Nivel[]): Nivel | null {
  const ordenados = [...niveis].sort((a, b) => b.min_fpts - a.min_fpts);
  return ordenados.find((n) => fpts >= n.min_fpts) ?? null;
}

export function proximoNivel(
  fpts: number,
  niveis: Nivel[]
): { nivel: Nivel; faltam: number } | null {
  const ordenados = [...niveis].sort((a, b) => a.min_fpts - b.min_fpts);
  const proximo = ordenados.find((n) => n.min_fpts > fpts);
  if (!proximo) return null;
  return { nivel: proximo, faltam: proximo.min_fpts - fpts };
}
