"use client";

import { Star, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBRL } from "@/lib/utils";
import type {
  CatalogoServico,
  Cliente,
  FptsRegras,
  Nivel,
} from "@/infrastructure/database/types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cliente: Cliente;
  nivel: Nivel;
  servicos: CatalogoServico[];
  fptsRegras: FptsRegras;
};

export function ClienteCardFptsDialog({
  open,
  onOpenChange,
  cliente,
  nivel,
  servicos,
  fptsRegras,
}: Props) {
  const cabelo = servicos.find((s) => /cabelo|corte/i.test(s.nome));
  const barba = servicos.find((s) => /barba/i.test(s.nome));
  const ambos = servicos.find((s) => /ambos|combo|completo/i.test(s.nome));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-0 bg-gradient-to-br from-[#e8c93a] via-[#d4a82a] to-[#a37f18]">
        <DialogTitle className="sr-only">Regras FPTS de {cliente.nome}</DialogTitle>

        <div className="p-6 space-y-5 text-[#2a1f00]">
          <div className="flex items-center gap-3">
            <div className="size-14 rounded-full bg-white/40 border-2 border-white/60 overflow-hidden flex items-center justify-center shrink-0">
              {cliente.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cliente.foto_url}
                  alt={cliente.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="size-8 text-[#2a1f00]/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-xl truncate">{cliente.nome}</p>
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3].map((i) => (
                  <Star
                    key={i}
                    className={
                      i <= nivel.numero
                        ? "size-4 text-[#fff] fill-[#fff]"
                        : "size-4 text-white/30"
                    }
                  />
                ))}
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/60 border border-white/80 shrink-0">
              <p className="font-semibold">{cliente.fpts} FPTS</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <FptsBola icone="⭐" label="Google" pontos={fptsRegras.google} />
            <FptsBola icone="🤝" label="Indicação" pontos={fptsRegras.indicacao} />
            <FptsBola icone="📸" label="Instagram" pontos={fptsRegras.instagram} />
            <FptsBola icone="⏱️" label="Visita" pontos={fptsRegras.pontualidade} />
          </div>

          <div className="bg-[#f5c930] border-2 border-[#c99a00] rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <TabelaPrecos
                titulo="15"
                subtitulo="QUINZENAL"
                cabelo={cabelo?.preco_quinzenal}
                barba={barba?.preco_quinzenal}
                ambos={ambos?.preco_quinzenal}
              />
              <TabelaPrecos
                titulo="30"
                subtitulo="MENSAL"
                cabelo={cabelo?.preco_mensal}
                barba={barba?.preco_mensal}
                ambos={ambos?.preco_mensal}
              />
            </div>
            <div className="mt-3 pt-3 border-t border-[#c99a00]/40 text-center text-xs font-semibold">
              EVENTUAL — Cabelo {fmt(cabelo?.preco_eventual)} · Barba{" "}
              {fmt(barba?.preco_eventual)} · Ambos {fmt(ambos?.preco_eventual)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function fmt(valor?: number): string {
  if (valor == null) return "--";
  return formatBRL(valor);
}

function FptsBola({
  icone,
  label,
  pontos,
}: {
  icone: string;
  label: string;
  pontos: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="size-14 rounded-full bg-white/80 border-2 border-white flex items-center justify-center text-2xl shadow-sm">
        <span>{icone}</span>
      </div>
      <p className="text-xs font-bold">{pontos}</p>
      <p className="text-[10px] uppercase tracking-wider opacity-75">{label}</p>
    </div>
  );
}

function TabelaPrecos({
  titulo,
  subtitulo,
  cabelo,
  barba,
  ambos,
}: {
  titulo: string;
  subtitulo: string;
  cabelo?: number;
  barba?: number;
  ambos?: number;
}) {
  return (
    <div className="flex gap-2">
      <div className="shrink-0">
        <p className="text-4xl font-black leading-none">{titulo}</p>
        <p className="text-[10px] font-semibold tracking-wider">{subtitulo}</p>
      </div>
      <div className="flex-1 text-xs space-y-0.5">
        <p>Cabelo = {fmt(cabelo)}</p>
        <p>Barba = {fmt(barba)}</p>
        <p>Ambos = {fmt(ambos)}</p>
      </div>
    </div>
  );
}
