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

export function telefoneParaWhatsapp(telefone: string | null | undefined): string | null {
  if (!telefone) return null;
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  // 10-11 dígitos = número BR sem DDI (ex: DDD 55 = RS é só área).
  // 12-13 dígitos = já tem DDI (55 + DDD + número).
  const comDdi = digitos.length >= 12 ? digitos : `55${digitos}`;
  return `https://wa.me/${comDdi}`;
}
