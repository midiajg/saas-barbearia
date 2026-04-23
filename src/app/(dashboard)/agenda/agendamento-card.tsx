"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  agendado: "bg-[var(--color-primary)]/15 border-l-[var(--color-primary)]",
  confirmado: "bg-[var(--color-primary)]/25 border-l-[var(--color-primary)]",
  em_atendimento: "bg-[var(--color-warning)]/20 border-l-[var(--color-warning)]",
  realizado: "bg-[var(--color-success)]/20 border-l-[var(--color-success)]",
  no_show: "bg-[var(--color-destructive)]/20 border-l-[var(--color-destructive)]",
  cancelado: "bg-[var(--color-muted)]/20 border-l-[var(--color-muted)] opacity-60",
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
        "absolute left-1 right-1 rounded border-l-4 p-1.5 overflow-hidden cursor-pointer transition-opacity text-left hover:brightness-110",
        STATUS_STYLE[status] ?? STATUS_STYLE.agendado,
        dim && "opacity-30"
      )}
      style={{ top, height: altura, borderLeftColor: cor }}
    >
      <div className="flex items-start gap-1">
        {status === "realizado" && (
          <div className="size-3.5 rounded-full bg-[var(--color-success)] flex items-center justify-center shrink-0 mt-0.5">
            <Check className="size-2.5 text-white" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate leading-tight">{nome}</p>
          <p className="text-[10px] text-[var(--color-muted)] leading-tight">
            {fmt(inicio)} - {fmt(fim)}
          </p>
          {valorTotal && altura > 50 && (
            <p className="text-[10px] mt-0.5 font-medium text-[var(--color-primary)]">
              {valorTotal}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
