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
  Package2,
  Infinity as InfIcon,
  Eye,
  EyeOff,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClienteDialog } from "./cliente-dialog";
import { registrarEventoFpts, registrarPontuacaoCustom } from "./actions";
import {
  venderPacoteAoCliente,
  cancelarPacoteDoCliente,
} from "../produtos/pacotes/actions";
import { diasDesde, formatBRL, telefoneParaWhatsapp } from "@/lib/utils";
import { proximoNivel } from "@/domain/fpts";
import { pacoteEstaAtivo } from "@/domain/pacotes";
import type {
  CatalogoServico,
  Cliente,
  FptsRegraCustom,
  FptsRegras,
  Nivel,
  Pacote,
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
  niveis,
  pacotes,
  servicos,
  fptsRegras,
  pontuacoesCustom,
  onClose,
}: {
  cliente: Cliente;
  nivel: Nivel | null;
  niveis: Nivel[];
  pacotes: Pacote[];
  servicos: CatalogoServico[];
  fptsRegras: FptsRegras;
  pontuacoesCustom: FptsRegraCustom[];
  onClose: () => void;
}) {
  const prox = proximoNivel(cliente.fpts, niveis);
  const progressoPct = prox
    ? Math.min(
        100,
        Math.round(((cliente.fpts - (nivel?.min_fpts ?? 0)) /
          (prox.nivel.min_fpts - (nivel?.min_fpts ?? 0))) *
          100)
      )
    : 100;
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [ajusteAberto, setAjusteAberto] = useState(false);
  const [ajustePontos, setAjustePontos] = useState("");
  const [ajusteDescricao, setAjusteDescricao] = useState("");
  const [pacoteAberto, setPacoteAberto] = useState(false);
  const [pacoteSel, setPacoteSel] = useState<string>("");
  // Privacidade: dados sensíveis começam OCULTOS. Toggle do olhinho revela.
  const [mostrarDados, setMostrarDados] = useState(false);
  const whatsappUrl = telefoneParaWhatsapp(cliente.telefone);
  const pa = cliente.pacote_ativo;
  const pacoteAtual = pacoteEstaAtivo(pa) ? pa : null;
  const pacotesAtivos = pacotes.filter((p) => p.ativo);

  function venderPacote() {
    if (!pacoteSel) {
      toast.error("Escolha um pacote");
      return;
    }
    startTransition(async () => {
      try {
        await venderPacoteAoCliente({
          clienteId: cliente.id,
          pacoteId: pacoteSel,
        });
        toast.success("Pacote ativado");
        setPacoteAberto(false);
        setPacoteSel("");
        onClose();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function cancelarPacote() {
    if (!confirm("Cancelar pacote ativo desse cliente?")) return;
    startTransition(async () => {
      try {
        await cancelarPacoteDoCliente(cliente.id);
        toast.success("Pacote cancelado");
        onClose();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }
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

  function registrarCustom(pontuacao: FptsRegraCustom) {
    startTransition(async () => {
      try {
        await registrarPontuacaoCustom(cliente.id, pontuacao.id);
        toast.success(`+${pontuacao.valor} FPTS — ${pontuacao.label}`);
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
      <div className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[520px] bg-[var(--color-background)] z-50 border-l border-[var(--color-border)] overflow-auto scrollbar-thin">
        {/* Letterhead */}
        <div className="sticky top-0 z-10 bg-[var(--color-background)] px-5 sm:px-6 pt-5 pb-4 border-b border-[var(--color-hairline)]">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)]">
              Ficha do cliente · Nº{" "}
              <span className="text-[var(--color-foreground)]">
                {cliente.id.slice(0, 6).toUpperCase()}
              </span>
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setMostrarDados((v) => !v)}
                title={mostrarDados ? "Ocultar dados sensíveis" : "Mostrar dados sensíveis"}
              >
                {mostrarDados ? (
                  <Eye className="size-3.5" />
                ) : (
                  <EyeOff className="size-3.5" />
                )}
              </Button>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex size-8 items-center justify-center rounded-md text-[var(--color-foreground)] hover:bg-[var(--color-surface)] transition-colors"
                  title={`WhatsApp · ${cliente.telefone}`}
                >
                  <MessageCircle className="size-3.5" />
                </a>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditOpen(true)}
                title="Editar"
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={onClose}>
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
          <div className="h-px bg-[var(--color-foreground)]/40" />
          <div className="h-px bg-[var(--color-hairline)] mt-1" />
        </div>

        <div className="px-5 sm:px-6 py-6 space-y-6">
          {/* Identificação editorial */}
          <div className="space-y-3">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)]">
              {nivel ? nivel.nome : "Cliente · Sem nível"}
              {nivel && (
                <span className="ml-2 text-[var(--color-primary)]">
                  {Array.from({ length: nivel.numero }).map(() => "★").join("")}
                </span>
              )}
            </p>
            <h2 className="display-serif text-3xl sm:text-4xl leading-tight">
              {cliente.nome}
            </h2>
          </div>

          {/* Painel de dados — grid editorial */}
          <div className="grid grid-cols-2 gap-px bg-[var(--color-hairline)]">
            <div className="bg-[var(--color-background)] p-4">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)] mb-2">
                FPTS
              </p>
              <p className="display-num text-2xl text-[var(--color-primary)] font-light leading-none">
                {cliente.fpts}
              </p>
            </div>
            <div className="bg-[var(--color-background)] p-4">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)] mb-2">
                Cashback
              </p>
              <p className="display-num text-2xl font-light leading-none">
                {cliente.cashback_fpts}
              </p>
            </div>
            <div className="col-span-2 bg-[var(--color-background)] px-4 py-3 flex items-baseline justify-between">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)]">
                Última visita
              </p>
              <p
                className={`font-mono text-sm tabular-nums ${
                  cliente.ultima_visita
                    ? "text-[var(--color-foreground)]"
                    : "text-[var(--color-muted)]"
                }`}
              >
                {ultimaVisitaTxt}
              </p>
            </div>
          </div>

          {/* Barra de progresso pro próximo nível */}
          {prox ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-muted)]">
                  Próximo nível: <span className="font-medium">{prox.nivel.nome}</span>
                </span>
                <span className="font-semibold text-[var(--color-primary)]">
                  faltam {prox.faltam} FPTS
                </span>
              </div>
              <div className="h-2 bg-[var(--color-background)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-primary)] to-yellow-400 transition-all"
                  style={{ width: `${progressoPct}%` }}
                />
              </div>
            </div>
          ) : nivel ? (
            <div className="px-3 py-2 rounded-md bg-yellow-400/10 text-xs text-center text-yellow-600 font-semibold">
              🏆 Nível máximo atingido — {nivel.nome}
            </div>
          ) : null}

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
              {pontuacoesCustom
                .filter((p) => p.ativo)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => registrarCustom(p)}
                    disabled={pending}
                    className="flex items-center justify-between p-3 rounded-md border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors text-left text-sm disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{p.icone}</span>
                      <span>{p.label}</span>
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-primary)]">
                      +{p.valor}
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

          {/* Pacote ativo */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold flex items-center gap-2">
              <Package2 className="size-3.5" /> Pacote
            </h3>
            {pacoteAtual ? (
              <div className="p-3 rounded-md border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{pacoteAtual.nome}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      Vence em{" "}
                      {new Date(pacoteAtual.fim).toLocaleDateString("pt-BR")}
                      {pacoteAtual.recorrente && " (mensalidade)"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-1 shrink-0">
                    {pacoteAtual.usos_restantes === null ? (
                      <>
                        <InfIcon className="size-3.5" /> ilimitado
                      </>
                    ) : (
                      `${pacoteAtual.usos_restantes} usos`
                    )}
                  </span>
                </div>
                <button
                  onClick={cancelarPacote}
                  disabled={pending}
                  className="text-xs text-[var(--color-destructive)] hover:underline disabled:opacity-50"
                >
                  Cancelar pacote
                </button>
              </div>
            ) : pacoteAberto ? (
              <div className="p-3 rounded-md border border-[var(--color-border)] space-y-2">
                <Label className="text-xs">Escolha o pacote</Label>
                <select
                  value={pacoteSel}
                  onChange={(e) => setPacoteSel(e.target.value)}
                  className="w-full h-9 rounded-md border border-[var(--color-border)] bg-transparent px-3 text-sm"
                >
                  <option value="">Selecione...</option>
                  {pacotesAtivos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — {formatBRL(p.preco)}
                      {p.recorrente ? "/mês" : ""}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPacoteAberto(false);
                      setPacoteSel("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={venderPacote} disabled={pending}>
                    Ativar
                  </Button>
                </div>
              </div>
            ) : pacotesAtivos.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)] italic px-2">
                Nenhum pacote cadastrado.{" "}
                <a
                  href="/produtos/pacotes"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  Criar
                </a>
              </p>
            ) : (
              <button
                onClick={() => setPacoteAberto(true)}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-md border border-dashed border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <Plus className="size-3.5" /> Vender pacote
              </button>
            )}
          </div>

          {mostrarDados ? (
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
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-[var(--color-muted)]">
                    <Phone className="size-4" />
                  </span>
                  <span className="flex-1">{cliente.telefone}</span>
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 h-7 rounded-md border border-[var(--color-border)] text-xs hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                      title="Abrir conversa no WhatsApp"
                    >
                      <MessageCircle className="size-3" /> WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setMostrarDados(true)}
              className="w-full p-3 rounded-md border border-dashed border-[var(--color-border)] text-xs text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] flex items-center justify-center gap-2"
            >
              <EyeOff className="size-3.5" /> Dados pessoais ocultos · clique para mostrar
            </button>
          )}

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

          {mostrarDados && cliente.eventos_fpts.length > 0 && (
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
