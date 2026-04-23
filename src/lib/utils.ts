import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function diasDesde(data: Date): number {
  const agora = new Date();
  const diff = agora.getTime() - data.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
