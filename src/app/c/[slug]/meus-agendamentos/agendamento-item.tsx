"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { cancelarPeloCliente } from "../agendar/actions";
import type { Atendimento } from "@/infrastructure/database/types";

const STATUS_LABEL: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em atendimento",
  realizado: "Realizado",
  no_show: "Não compareceu",
  cancelado: "Cancelado",
};

const STATUS_COR: Record<string, string> = {
  agendado: "bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
  confirmado: "bg-[var(--color-primary)]/25 text-[var(--color-primary)]",
  em_atendimento: "bg-[var(--color-warning)]/20 text-[var(--color-warning)]",
  realizado: "bg-[var(--color-success)]/20 text-[var(--color-success)]",
  no_show: "bg-[var(--color-destructive)]/20 text-[var(--color-destructive)]",
  cancelado: "bg-[var(--color-muted)]/20 text-[var(--color-muted)]",
};

export function AgendamentoItem({
  atendimento,
  barbeiroNome,
  slug,
  podeCancelar,
}: {
  atendimento: Atendimento;
  barbeiroNome: string;
  slug: string;
  podeCancelar: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const inicio = new Date(atendimento.inicio);

  function cancelar() {
    startTransition(async () => {
      try {
        await cancelarPeloCliente(slug, atendimento.id);
        toast.success("Agendamento cancelado");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao cancelar");
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-sm capitalize">
              {inicio.toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}
              {" · "}
              {inicio.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              com {barbeiroNome}
            </p>
            {atendimento.valor_total && (
              <p className="text-xs text-[var(--color-primary)] mt-1">
                {formatBRL(Number.parseFloat(atendimento.valor_total))}
              </p>
            )}
          </div>
          <span
            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${
              STATUS_COR[atendimento.status] ?? ""
            }`}
          >
            {STATUS_LABEL[atendimento.status] ?? atendimento.status}
          </span>
        </div>

        {podeCancelar && (
          <>
            {confirmando ? (
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
                <p className="text-xs flex-1">Cancelar este agendamento?</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmando(false)}
                  disabled={pending}
                >
                  Não
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelar}
                  disabled={pending}
                  className="text-[var(--color-destructive)]"
                >
                  {pending ? "..." : "Sim, cancelar"}
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmando(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-destructive)] transition pt-2 border-t border-[var(--color-border)]"
              >
                <X className="size-3" />
                Cancelar agendamento
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
