"use client";

import { useState, useTransition } from "react";
import {
  Star,
  Home,
  Cake,
  Users as UsersIcon,
  Briefcase,
  Dumbbell,
  Phone,
  X,
  Pencil,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClienteDialog } from "./cliente-dialog";
import { registrarEventoFpts } from "./actions";
import { diasDesde } from "@/lib/utils";
import type {
  Cliente,
  FptsRegras,
  Nivel,
  TipoEventoFpts,
} from "@/infrastructure/database/types";

type Acao = {
  tipo: TipoEventoFpts;
  label: string;
  icone: string;
  pontos: number;
};

export function ClienteCardDrawer({
  cliente,
  nivel,
  fptsRegras,
  onClose,
}: {
  cliente: Cliente;
  nivel: Nivel | null;
  fptsRegras: FptsRegras;
  onClose: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [ajusteAberto, setAjusteAberto] = useState(false);
  const [ajustePontos, setAjustePontos] = useState("");
  const [ajusteDescricao, setAjusteDescricao] = useState("");
  const d = cliente.dados_pessoais ?? {};

  const ultimaVisitaTxt = cliente.ultima_visita
    ? `há ${diasDesde(new Date(cliente.ultima_visita))} dias`
    : "nunca";

  const acoes: Acao[] = [
    { tipo: "google", label: "Avaliou Google", icone: "⭐", pontos: fptsRegras.google },
    {
      tipo: "indicacao",
      label: "Indicou amigo",
      icone: "🤝",
      pontos: fptsRegras.indicacao,
    },
    {
      tipo: "instagram",
      label: "Seguiu Instagram",
      icone: "📸",
      pontos: fptsRegras.instagram,
    },
    {
      tipo: "aniversario",
      label: "Bônus aniversário",
      icone: "🎂",
      pontos: fptsRegras.aniversario,
    },
  ];

  function registrar(acao: Acao) {
    startTransition(async () => {
      try {
        await registrarEventoFpts(cliente.id, acao.tipo, acao.label);
        toast.success(`+${acao.pontos} FPTS — ${acao.label}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao registrar");
      }
    });
  }

  function salvarAjuste() {
    const n = Number.parseInt(ajustePontos, 10);
    if (Number.isNaN(n) || n === 0) {
      toast.error("Informe um número diferente de zero");
      return;
    }
    if (!ajusteDescricao.trim()) {
      toast.error("Descreva o motivo do ajuste");
      return;
    }
    startTransition(async () => {
      try {
        await registrarEventoFpts(
          cliente.id,
          "ajuste",
          ajusteDescricao.trim(),
          n
        );
        toast.success(`${n > 0 ? "+" : ""}${n} FPTS registrados`);
        setAjusteAberto(false);
        setAjustePontos("");
        setAjusteDescricao("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-[var(--color-surface)] z-50 border-l border-[var(--color-border)] overflow-auto scrollbar-thin">
        <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] p-4 flex items-center justify-between">
          <h2 className="font-display text-lg">Cliente</h2>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setEditOpen(true)}
              title="Editar"
            >
              <Pencil className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="size-16 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center text-2xl font-medium">
              {cliente.nome.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-medium">{cliente.nome}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-500 font-medium">
                  {cliente.fpts} FPTS
                </span>
                {nivel && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: nivel.numero }).map((_, i) => (
                      <Star
                        key={i}
                        className="size-3.5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                )}
              </div>
              {nivel && (
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  {nivel.nome}
                </p>
              )}
            </div>
          </div>

          <div className="px-3 py-2 rounded-md bg-[var(--color-background)]/40 text-sm flex items-center justify-between">
            <span>Última visita</span>
            <span className="font-medium text-[var(--color-primary)]">
              {ultimaVisitaTxt}
            </span>
          </div>

          {/* Ações FPTS */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold">
              Dar pontos FPTS
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {acoes.map((a) => (
                <button
                  key={a.tipo}
                  onClick={() => registrar(a)}
                  disabled={pending}
                  className="flex items-center justify-between p-3 rounded-md border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors text-left text-sm disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{a.icone}</span>
                    <span>{a.label}</span>
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-primary)]">
                    +{a.pontos}
                  </span>
                </button>
              ))}
            </div>

            {ajusteAberto ? (
              <div className="p-3 rounded-md border border-[var(--color-border)] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="pontos" className="text-xs">
                      Pontos (use negativo para tirar)
                    </Label>
                    <Input
                      id="pontos"
                      type="number"
                      value={ajustePontos}
                      onChange={(e) => setAjustePontos(e.target.value)}
                      placeholder="100 ou -50"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="motivo" className="text-xs">
                    Motivo
                  </Label>
                  <Input
                    id="motivo"
                    value={ajusteDescricao}
                    onChange={(e) => setAjusteDescricao(e.target.value)}
                    placeholder="Ex: compensação, correção, bônus..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAjusteAberto(false)}
                  >
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={salvarAjuste} disabled={pending}>
                    Aplicar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAjusteAberto(true)}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-md border border-dashed border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <Plus className="size-3.5" />
                <Minus className="size-3.5 -ml-2" />
                Ajuste manual
              </button>
            )}
          </div>

          <div className="space-y-2 text-sm">
            {d.endereco && (
              <Row icon={<Home className="size-4" />} text={d.endereco} />
            )}
            {d.aniversario && (
              <Row
                icon={<Cake className="size-4" />}
                text={new Date(d.aniversario).toLocaleDateString("pt-BR")}
              />
            )}
            {d.filhos && (
              <Row icon={<UsersIcon className="size-4" />} text={d.filhos} />
            )}
            {d.profissao && (
              <Row icon={<Briefcase className="size-4" />} text={d.profissao} />
            )}
            {d.hobby && (
              <Row icon={<Dumbbell className="size-4" />} text={d.hobby} />
            )}
            {cliente.telefone && (
              <Row
                icon={<Phone className="size-4" />}
                text={cliente.telefone}
              />
            )}
          </div>

          {nivel?.beneficios && nivel.beneficios.length > 0 ? (
            <div className="p-3 rounded-md border border-yellow-500/30 bg-yellow-500/5 space-y-1">
              <p className="text-xs uppercase tracking-wider text-yellow-500/80 font-semibold">
                Benefícios {nivel.nome}
              </p>
              {nivel.beneficios.map((b, i) => (
                <p key={i} className="text-sm">
                  {b}
                </p>
              ))}
            </div>
          ) : null}

          {cliente.eventos_fpts.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Histórico FPTS</h3>
              <ul className="space-y-1.5">
                {cliente.eventos_fpts
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((e, i) => (
                    <li
                      key={i}
                      className="p-2 rounded-md border border-[var(--color-border)] text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium">{e.tipo}</span>
                        {e.descricao && (
                          <span className="text-[var(--color-muted)] ml-2">
                            {e.descricao}
                          </span>
                        )}
                      </div>
                      <span
                        className={
                          e.pontos >= 0
                            ? "text-[var(--color-primary)]"
                            : "text-[var(--color-warning)]"
                        }
                      >
                        {e.pontos >= 0 ? "+" : ""}
                        {e.pontos}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <ClienteDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editing={cliente}
      />
    </>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[var(--color-muted)]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
