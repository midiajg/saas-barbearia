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
  Info,
  MessageCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  // Começa já mostrando tudo (mockup)
  const [expandido, setExpandido] = useState(true);
  const [showFptsDialog, setShowFptsDialog] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

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

          {/* Tooltip nível (topo-direito) */}
          {nivel && nivel.beneficios.length > 0 && (
            <div className="absolute -top-2 -right-4 translate-x-full bg-[#fff8d8] border-2 border-[#d4a82a]/60 rounded-xl p-3 min-w-[220px] z-10 hidden md:block text-[#6b4e00]">
              <div className="flex items-center gap-2 mb-1.5">
                <Star className="size-4 text-[#d4a82a] fill-[#d4a82a]" />
                <span className="font-display text-sm font-bold">
                  NÍVEL {nivel.numero}
                </span>
              </div>
              <ul className="space-y-1">
                {nivel.beneficios.map((b, i) => (
                  <li
                    key={i}
                    className="text-xs font-semibold tracking-wide uppercase"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Info tooltip — regras do FPTS resumidas */}
          {showInfo && (
            <div className="absolute bottom-16 left-4 bg-white border-2 border-[var(--color-primary)] rounded-xl p-3 z-20 shadow-lg text-sm min-w-[240px] text-[var(--color-foreground)]">
              <p className="font-semibold text-[var(--color-primary)] mb-1 text-xs uppercase tracking-wider">
                Ganho de FPTS
              </p>
              <ul className="space-y-0.5 text-xs">
                <li>⭐ Avaliar Google: {fptsRegras.google} FPTS</li>
                <li>🤝 Indicação: {fptsRegras.indicacao} FPTS</li>
                <li>📸 Instagram: {fptsRegras.instagram} FPTS</li>
                <li>⏱️ Visita pontual: {fptsRegras.pontualidade} FPTS</li>
                <li>🎂 Aniversário: {fptsRegras.aniversario} FPTS</li>
              </ul>
            </div>
          )}

          {/* Card inteiro verde escuro, texto branco */}
          <div className="rounded-2xl overflow-hidden bg-[var(--color-primary)] shadow-2xl">
            {/* Header com foto + nome + FPTS + stars */}
            <div className="px-5 pt-5 pb-4 text-white">
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
                      className="px-2.5 py-0.5 rounded-full bg-[#f5c930] text-[#2a1f00] text-xs font-bold hover:brightness-110 transition shadow"
                    >
                      {cliente.fpts} FPTS
                    </button>
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-4 drop-shadow",
                            i <= estrelas
                              ? "text-[#f5c930] fill-[#f5c930]"
                              : "text-white/30"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Última visita */}
            <div className="px-5">
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-center">
                  <p className="text-xs font-bold text-white tracking-wide">
                    {diasUltimaVisita == null
                      ? "PRIMEIRA VISITA"
                      : `ÚLTIMA VISITA HÁ ${diasUltimaVisita} DIA${diasUltimaVisita === 1 ? "" : "S"}`}
                  </p>
                </div>
                <button
                  onClick={() => setExpandido((v) => !v)}
                  className="p-1.5 text-white/70 hover:text-white transition"
                  aria-label={expandido ? "Recolher" : "Expandir"}
                >
                  {expandido ? (
                    <Eye className="size-5" />
                  ) : (
                    <EyeOff className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Dados do cliente + ícones laterais */}
            <div className="px-5 pt-3 pb-4 text-white">
              {expandido ? (
                <div className="flex gap-3 items-start">
                  <ul className="flex-1 space-y-1.5 text-sm">
                    {dados.endereco && (
                      <li className="flex items-center gap-2">
                        <Home className="size-4 text-white/70 shrink-0" />
                        <span className="truncate font-medium tracking-wide uppercase">
                          {dados.endereco}
                        </span>
                      </li>
                    )}
                    {dados.aniversario && (
                      <li className="flex items-center gap-2">
                        <Cake className="size-4 text-white/70 shrink-0" />
                        <span className="font-medium tracking-wide">
                          <span className="font-bold">{aniv}</span>
                          {idade != null && (
                            <span className="text-white/70 ml-2 italic">
                              {idade} anos
                            </span>
                          )}
                        </span>
                      </li>
                    )}
                    {dados.filhos && (
                      <li className="flex items-center gap-2">
                        <Baby className="size-4 text-white/70 shrink-0" />
                        <span className="truncate font-medium tracking-wide uppercase">
                          {dados.filhos}
                        </span>
                      </li>
                    )}
                    {dados.profissao && (
                      <li className="flex items-center gap-2">
                        <Briefcase className="size-4 text-white/70 shrink-0" />
                        <span className="truncate font-medium tracking-wide uppercase">
                          {dados.profissao}
                        </span>
                      </li>
                    )}
                    {dados.hobby && (
                      <li className="flex items-center gap-2">
                        <Heart className="size-4 text-white/70 shrink-0" />
                        <span className="truncate font-medium tracking-wide uppercase">
                          {dados.hobby}
                        </span>
                      </li>
                    )}
                    {!dados.endereco &&
                      !dados.aniversario &&
                      !dados.filhos &&
                      !dados.profissao &&
                      !dados.hobby && (
                        <li className="text-xs text-white/60 italic">
                          Sem dados relacionais preenchidos
                        </li>
                      )}
                  </ul>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => setShowInfo((v) => !v)}
                      className="size-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition"
                      title="Info regras FPTS"
                    >
                      <Info className="size-4" />
                    </button>
                    <button
                      disabled
                      className="size-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 cursor-not-allowed"
                      title="Última conversa (em breve)"
                    >
                      <MessageCircle className="size-4" />
                    </button>
                    <a
                      href="/clientes"
                      className="size-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition"
                      title="Editar cliente"
                    >
                      <Pencil className="size-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 py-1">
                  <div className="h-2 rounded-full bg-white/15" />
                  <div className="h-2 rounded-full bg-white/15 w-11/12" />
                  <div className="h-2 rounded-full bg-white/15 w-10/12" />
                  <div className="h-2 rounded-full bg-white/15 w-11/12" />
                </div>
              )}
            </div>

            {/* Rodapé: ℹ info esquerda + FECHAR CONTA pílula + 💰 */}
            <div className="px-5 pb-5 flex items-center gap-3">
              <button
                onClick={() => setShowInfo((v) => !v)}
                className="size-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition shrink-0"
                title="Info"
              >
                <Info className="size-4" />
              </button>
              <button
                onClick={() => {
                  onOpenChange(false);
                  onFecharConta();
                }}
                disabled={
                  atendimento.status === "realizado" ||
                  atendimento.status === "cancelado"
                }
                className="flex-1 h-11 rounded-full bg-white text-[var(--color-primary)] font-bold hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow"
              >
                FECHAR CONTA
              </button>
              <button
                onClick={() => setShowFptsDialog(true)}
                className="size-9 rounded-full bg-[#f5c930] hover:brightness-110 flex items-center justify-center shadow shrink-0"
                title="Ver regras FPTS"
              >
                <DollarSign className="size-4 text-[#2a1f00]" />
              </button>
            </div>

            {atendimento.valor_total && (
              <div className="px-5 pb-4 -mt-2">
                <p className="text-center text-xs text-white/70">
                  Valor previsto:{" "}
                  <span className="font-semibold text-white">
                    {formatBRL(Number.parseFloat(atendimento.valor_total))}
                  </span>
                </p>
              </div>
            )}
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
