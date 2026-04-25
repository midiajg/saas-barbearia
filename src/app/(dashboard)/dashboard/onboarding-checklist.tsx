"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Check,
  ChevronRight,
  X,
  Clock,
  Scissors,
  Users as UsersIcon,
  Palette,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type OnboardingStatus = {
  temServicos: boolean;
  temBarbeiros: boolean;
  temHorarios: boolean;
  temClientes: boolean;
};

const PASSOS = [
  {
    key: "temHorarios",
    label: "Definir horário de funcionamento",
    descricao: "Defina os dias e horários que a barbearia abre",
    href: "/config/horarios",
    icon: Clock,
  },
  {
    key: "temServicos",
    label: "Cadastrar primeiro serviço",
    descricao: "Adicione corte, barba ou outros serviços do cardápio",
    href: "/servicos",
    icon: Scissors,
  },
  {
    key: "temBarbeiros",
    label: "Adicionar mais barbeiros (opcional)",
    descricao: "Convide a equipe pra se logar e ter agenda própria",
    href: "/equipe",
    icon: UsersIcon,
  },
  {
    key: "temClientes",
    label: "Cadastrar primeiro cliente",
    descricao: "Comece a construir histórico desde o primeiro atendimento",
    href: "/clientes",
    icon: Palette,
  },
] as const;

export function OnboardingChecklist({
  status,
}: {
  status: OnboardingStatus;
}) {
  const [escondido, setEscondido] = useState(false);

  // Só mostra se as 3 primeiras coisas essenciais estão pendentes
  const essenciaisPendentes = !status.temHorarios || !status.temServicos;
  if (!essenciaisPendentes || escondido) return null;

  const totalFeito = PASSOS.filter((p) => status[p.key]).length;
  const total = PASSOS.length;
  const pct = Math.round((totalFeito / total) * 100);

  return (
    <Card className="border-[var(--color-primary)]/40 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="size-9 rounded-md bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg leading-tight">
                Bem-vindo! Vamos configurar sua barbearia
              </h2>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                {totalFeito}/{total} passos concluídos
              </p>
            </div>
          </div>
          <button
            onClick={() => setEscondido(true)}
            className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors shrink-0"
            title="Esconder"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="h-1.5 bg-[var(--color-background)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <ul className="space-y-2">
          {PASSOS.map((p) => {
            const feito = status[p.key];
            const Icon = p.icon;
            return (
              <li key={p.key}>
                <Link
                  href={p.href}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-md border transition-colors",
                    feito
                      ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5"
                      : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-hover)]"
                  )}
                >
                  <div
                    className={cn(
                      "size-7 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      feito
                        ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                        : "bg-[var(--color-background)] text-[var(--color-muted)] border border-[var(--color-border)]"
                    )}
                  >
                    {feito ? (
                      <Check className="size-4" />
                    ) : (
                      <Icon className="size-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        feito && "text-[var(--color-muted)] line-through"
                      )}
                    >
                      {p.label}
                    </p>
                    <p className="text-xs text-[var(--color-muted)] truncate">
                      {p.descricao}
                    </p>
                  </div>
                  {!feito && (
                    <ChevronRight className="size-4 text-[var(--color-muted)] shrink-0" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
