"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  agendado: "bg-[var(--color-primary)]/8",
  confirmado: "bg-[var(--color-primary)]/15",
  em_atendimento: "bg-[var(--color-warning)]/15",
  realizado: "bg-[var(--color-success)]/15",
  no_show: "bg-[var(--color-destructive)]/15",
  cancelado: "bg-[var(--color-muted)]/10 opacity-60",
};

export function AgendamentoCard({
  top,
  altura,
  cor,
  nome,
  inicio,
  fim,
  status,
  valorTotal,
  dim,
  onClick,
}: {
  top: number;
  altura: number;
  cor: string;
  nome: string;
  inicio: Date;
  fim: Date;
  status: string;
  valorTotal: string | null;
  dim?: boolean;
  onClick?: () => void;
}) {
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "absolute left-1 right-1 border-l-2 px-2 py-1.5 overflow-hidden cursor-pointer transition-all text-left hover:brightness-110 hover:translate-x-0.5",
        STATUS_STYLE[status] ?? STATUS_STYLE.agendado,
        dim && "opacity-30"
      )}
      style={{ top, height: altura, borderLeftColor: cor }}
    >
      <div className="flex items-start gap-1.5">
        {status === "realizado" && (
          <div className="size-3 bg-[var(--color-success)] flex items-center justify-center shrink-0 mt-0.5">
            <Check className="size-2 text-[var(--color-primary-foreground)]" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] tracking-wider tabular-nums text-[var(--color-muted)] leading-tight">
            {fmt(inicio)} — {fmt(fim)}
          </p>
          <p className="text-xs font-medium truncate leading-tight mt-0.5">
            {nome}
          </p>
          {valorTotal && altura > 50 && (
            <p className="font-mono tabular-nums text-[10px] mt-0.5 text-[var(--color-primary)]">
              {valorTotal}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
