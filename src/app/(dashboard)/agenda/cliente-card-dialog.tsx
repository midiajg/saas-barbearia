"use client";

import { useMemo, useState } from "react";
import {
  Star,
  Eye,
  EyeOff,
  Home,
  Cake,
  Baby,
  Briefcase,
  Heart,
  Pencil,
  Camera,
  User,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, diasDesde, formatBRL } from "@/lib/utils";
import { nivelAtual } from "@/domain/fpts";
import type {
  Atendimento,
  CatalogoServico,
  Cliente,
  FptsRegras,
  Nivel,
} from "@/infrastructure/database/types";
import { ClienteCardFptsDialog } from "./cliente-card-fpts-dialog";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  atendimento: Atendimento;
  cliente: Cliente | null;
  niveis: Nivel[];
  servicos: CatalogoServico[];
  fptsRegras: FptsRegras;
  onFecharConta: () => void;
};

function idadeDe(aniversario: string | undefined): number | null {
  if (!aniversario) return null;
  const nasc = new Date(aniversario);
  const agora = new Date();
  let idade = agora.getFullYear() - nasc.getFullYear();
  const m = agora.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && agora.getDate() < nasc.getDate())) idade -= 1;
  return idade;
}

function aniversarioLabel(aniversario: string | undefined): string {
  if (!aniversario) return "";
  const d = new Date(aniversario);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

export function ClienteCardDialog({
  open,
  onOpenChange,
  atendimento,
  cliente,
  niveis,
  servicos,
  fptsRegras,
  onFecharConta,
}: Props) {
  const [expandido, setExpandido] = useState(false);
  const [showFptsDialog, setShowFptsDialog] = useState(false);

  const nivel = useMemo(() => {
    if (!cliente) return null;
    return nivelAtual(cliente.fpts, niveis);
  }, [cliente, niveis]);

  const estrelas = nivel?.numero ?? 0;
  const diasUltimaVisita = cliente?.ultima_visita
    ? diasDesde(new Date(cliente.ultima_visita))
    : null;
  const dados = cliente?.dados_pessoais ?? {};
  const idade = idadeDe(dados.aniversario);
  const aniv = aniversarioLabel(dados.aniversario);

  if (!cliente) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Cliente avulso</DialogTitle>
          <div className="flex justify-end pt-2">
            <button
              onClick={onFecharConta}
              className="h-10 px-4 rounded-full bg-[var(--color-primary)] text-white font-semibold flex items-center gap-2"
            >
              <DollarSign className="size-4" /> Fechar conta
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 overflow-visible bg-transparent border-0 shadow-none">
          <DialogTitle className="sr-only">{cliente.nome}</DialogTitle>

          {nivel && nivel.beneficios.length > 0 && (
            <div className="absolute -top-2 -right-4 translate-x-full bg-[var(--color-warning)]/15 border-2 border-[var(--color-warning)]/60 rounded-xl p-3 min-w-[200px] z-10 hidden md:block">
              <div className="flex items-center gap-2 mb-1">
                <Star className="size-4 text-[var(--color-warning)] fill-[var(--color-warning)]" />
                <span className="font-display text-sm">
                  Nível {nivel.numero} — {nivel.nome}
                </span>
              </div>
              <ul className="space-y-0.5">
                {nivel.beneficios.slice(0, 4).map((b, i) => (
                  <li
                    key={i}
                    className="text-xs text-[var(--color-warning)] font-medium"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl overflow-hidden bg-[var(--color-primary)]">
            <div className="px-5 pt-5 pb-6 text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="size-14 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center">
                    {cliente.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cliente.foto_url}
                        alt={cliente.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="size-8 text-white/70" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -left-1 size-6 rounded-full bg-white flex items-center justify-center shadow">
                    <Camera className="size-3 text-[var(--color-primary)]" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-display text-xl truncate">
                    {cliente.nome}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setShowFptsDialog(true)}
                      className="px-2 py-0.5 rounded-full bg-[var(--color-warning)]/90 text-xs font-semibold text-[var(--color-background)] hover:brightness-110 transition"
                    >
                      {cliente.fpts} FPTS
                    </button>
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-4",
                            i <= estrelas
                              ? "text-[var(--color-warning)] fill-[var(--color-warning)]"
                              : "text-white/30"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-surface)] px-5 pt-4 pb-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 px-3 py-1.5 rounded-full bg-[var(--color-background)] text-center">
                  <p className="text-xs font-semibold text-[var(--color-primary)]">
                    {diasUltimaVisita == null
                      ? "PRIMEIRA VISITA"
                      : `ÚLTIMA VISITA HÁ ${diasUltimaVisita} DIA${diasUltimaVisita === 1 ? "" : "S"}`}
                  </p>
                </div>
                <button
                  onClick={() => setExpandido((v) => !v)}
                  className="ml-3 p-1 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
                  aria-label={expandido ? "Recolher" : "Expandir"}
                >
                  {expandido ? (
                    <Eye className="size-5" />
                  ) : (
                    <EyeOff className="size-5" />
                  )}
                </button>
              </div>

              {expandido ? (
                <div className="flex gap-4">
                  <ul className="flex-1 space-y-1.5 text-sm">
                    {dados.endereco && (
                      <li className="flex items-center gap-2">
                        <Home className="size-4 text-[var(--color-muted)] shrink-0" />
                        <span className="truncate">{dados.endereco}</span>
                      </li>
                    )}
                    {dados.aniversario && (
                      <li className="flex items-center gap-2">
                        <Cake className="size-4 text-[var(--color-muted)] shrink-0" />
                        <span>
                          {aniv}
                          {idade != null && (
                            <span className="text-[var(--color-muted)] ml-1 italic">
                              {idade} anos
                            </span>
                          )}
                        </span>
                      </li>
                    )}
                    {dados.filhos && (
                      <li className="flex items-center gap-2">
                        <Baby className="size-4 text-[var(--color-muted)] shrink-0" />
                        <span className="truncate">{dados.filhos}</span>
                      </li>
                    )}
                    {dados.profissao && (
                      <li className="flex items-center gap-2">
                        <Briefcase className="size-4 text-[var(--color-muted)] shrink-0" />
                        <span className="truncate">{dados.profissao}</span>
                      </li>
                    )}
                    {dados.hobby && (
                      <li className="flex items-center gap-2">
                        <Heart className="size-4 text-[var(--color-muted)] shrink-0" />
                        <span className="truncate">{dados.hobby}</span>
                      </li>
                    )}
                    {!dados.endereco &&
                      !dados.aniversario &&
                      !dados.filhos &&
                      !dados.profissao &&
                      !dados.hobby && (
                        <li className="text-xs text-[var(--color-muted)] italic">
                          Sem dados relacionais preenchidos
                        </li>
                      )}
                  </ul>

                  <div className="flex flex-col gap-2">
                    <a
                      href="/clientes"
                      className="p-1.5 rounded-md hover:bg-[var(--color-surface-hover)] text-[var(--color-muted)] hover:text-[var(--color-primary)]"
                      aria-label="Editar cliente"
                    >
                      <Pencil className="size-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-1">
                  <div className="h-2 rounded-full bg-[var(--color-background)]" />
                  <div className="h-2 rounded-full bg-[var(--color-background)] w-11/12" />
                  <div className="h-2 rounded-full bg-[var(--color-background)] w-10/12" />
                  <div className="h-2 rounded-full bg-[var(--color-background)] w-11/12" />
                </div>
              )}

              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={() => {
                    onOpenChange(false);
                    onFecharConta();
                  }}
                  disabled={
                    atendimento.status === "realizado" ||
                    atendimento.status === "cancelado"
                  }
                  className="flex-1 h-11 rounded-full bg-[var(--color-primary)] text-white font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  FECHAR CONTA
                  <DollarSign className="size-4" />
                </button>
              </div>

              {atendimento.valor_total && (
                <p className="text-center text-xs text-[var(--color-muted)]">
                  Valor previsto:{" "}
                  <span className="font-medium text-[var(--color-primary)]">
                    {formatBRL(Number.parseFloat(atendimento.valor_total))}
                  </span>
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {nivel && (
        <ClienteCardFptsDialog
          open={showFptsDialog}
          onOpenChange={setShowFptsDialog}
          cliente={cliente}
          nivel={nivel}
          servicos={servicos}
          fptsRegras={fptsRegras}
        />
      )}
    </>
  );
}
