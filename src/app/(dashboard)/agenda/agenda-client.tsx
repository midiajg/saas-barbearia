"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatBRL } from "@/lib/utils";
import { NovoAgendamentoDialog } from "./novo-agendamento-dialog";
import { AgendamentoCard } from "./agendamento-card";
import { FecharContaDialog } from "./fechar-conta-dialog";
import { ClienteCardDialog } from "./cliente-card-dialog";
import { FilaEsperaPainel } from "./fila-espera-painel";
import { nivelAtual } from "@/domain/fpts";
import { Eyebrow, DoubleRule } from "@/components/editorial";
import type {
  Atendimento,
  CashbackRegra,
  CatalogoProduto,
  CatalogoServico,
  Cliente,
  Equipe,
  FilaItem,
  FptsRegras,
  Nivel,
} from "@/infrastructure/database/types";

const SLOT_MIN = 15;
const SLOT_HEIGHT = 18;

export function AgendaClient({
  data,
  equipe,
  atendimentos,
  servicos,
  clientes,
  produtos,
  niveis,
  fila,
  horaInicio,
  horaFim,
  cashbackRegra,
  fptsRegras,
}: {
  data: string;
  equipe: Equipe[];
  atendimentos: Atendimento[];
  servicos: CatalogoServico[];
  clientes: Cliente[];
  produtos: CatalogoProduto[];
  niveis: Nivel[];
  fila: FilaItem[];
  horaInicio: number;
  horaFim: number;
  cashbackRegra: CashbackRegra;
  fptsRegras: FptsRegras;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busca, setBusca] = useState("");
  const [openNovo, setOpenNovo] = useState(false);
  const [cardAbertoId, setCardAbertoId] = useState<string | null>(null);
  const [fechandoId, setFechandoId] = useState<string | null>(null);
  const [slotInicial, setSlotInicial] = useState<{
    barbeiroId: string;
    inicio: Date;
  } | null>(null);

  const dataObj = new Date(data + "T12:00:00");
  const clientesMap = useMemo(
    () => new Map(clientes.map((c) => [c.id, c])),
    [clientes]
  );

  function navegarDia(delta: number) {
    const nova = new Date(dataObj);
    nova.setDate(nova.getDate() + delta);
    startTransition(() => {
      router.push(`/agenda?data=${nova.toISOString().slice(0, 10)}`);
    });
  }

  const slots = useMemo(() => {
    const arr: Array<{ hora: number; minuto: number; label: string }> = [];
    for (let h = horaInicio; h < horaFim; h++) {
      for (let m = 0; m < 60; m += SLOT_MIN) {
        arr.push({
          hora: h,
          minuto: m,
          label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        });
      }
    }
    return arr;
  }, [horaInicio, horaFim]);

  const porBarbeiro = useMemo(() => {
    const map = new Map<string, Atendimento[]>();
    for (const b of equipe) map.set(b.id, []);
    for (const a of atendimentos) {
      if (a.status === "cancelado") continue;
      const lista = map.get(a.barbeiro_id);
      if (lista) lista.push(a);
    }
    return map;
  }, [atendimentos, equipe]);

  function abrirSlot(barbeiroId: string, slotIdx: number) {
    const slot = slots[slotIdx];
    const inicio = new Date(dataObj);
    inicio.setHours(slot.hora, slot.minuto, 0, 0);
    setSlotInicial({ barbeiroId, inicio });
    setOpenNovo(true);
  }

  function abrirNovoLivre() {
    setSlotInicial(null);
    setOpenNovo(true);
  }

  const atendimentoCard = cardAbertoId
    ? atendimentos.find((a) => a.id === cardAbertoId)
    : null;
  const clienteCard = atendimentoCard?.cliente_id
    ? (clientesMap.get(atendimentoCard.cliente_id) ?? null)
    : null;

  const atendimentoFechando = fechandoId
    ? atendimentos.find((a) => a.id === fechandoId)
    : null;
  const clienteFechando = atendimentoFechando?.cliente_id
    ? clientesMap.get(atendimentoFechando.cliente_id)
    : null;
  const clienteNivelNumero = clienteFechando
    ? (nivelAtual(clienteFechando.fpts, niveis)?.numero ?? null)
    : null;

  return (
    <div className="space-y-4 h-full flex flex-col -m-4 sm:-m-5 md:-m-6 p-4 sm:p-5 md:p-6">
      {/* Letterhead da agenda */}
      <header className="space-y-3">
        <DoubleRule />
        <div className="py-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow marker className="mb-2">
              Agenda · Visão do dia
            </Eyebrow>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => navegarDia(-1)}
                disabled={pending}
                className="rounded-none border border-[var(--color-hairline)] hover:bg-[var(--color-surface)]"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="min-w-[140px] sm:min-w-[180px]">
                <h1 className="display-serif text-2xl sm:text-3xl leading-none">
                  {dataObj.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                  })}
                </h1>
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)] mt-1">
                  {dataObj.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => navegarDia(1)}
                disabled={pending}
                className="rounded-none border border-[var(--color-hairline)] hover:bg-[var(--color-surface)]"
              >
                <ChevronRight className="size-4" />
              </Button>
              <Input
                type="date"
                value={data}
                onChange={(e) =>
                  startTransition(() =>
                    router.push(`/agenda?data=${e.target.value}`)
                  )
                }
                className="w-36 sm:w-40 hidden sm:block h-9 rounded-none bg-transparent border-[var(--color-hairline)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:max-w-md lg:flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-muted)]" />
              <Input
                placeholder="Buscar cliente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-9 rounded-none bg-transparent border-[var(--color-hairline)] focus-visible:border-[var(--color-primary)]"
              />
            </div>
            <Button
              onClick={abrirNovoLivre}
              className="shrink-0 rounded-none h-9 font-mono tracking-widest text-[10px] uppercase"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Agendar</span>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="shrink-0 rounded-none h-9 font-mono tracking-widest text-[10px] uppercase border border-[var(--color-hairline)] hover:bg-[var(--color-surface)]"
            >
              <a href={`/agenda/semana?data=${data}`}>Semana →</a>
            </Button>
          </div>
        </div>
        <DoubleRule />
      </header>

      {equipe.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <div className="space-y-3 max-w-sm">
            <Eyebrow className="justify-center">Equipe vazia</Eyebrow>
            <p className="display-serif text-2xl">
              Cadastre barbeiros antes de <em className="display-italic">abrir a agenda.</em>
            </p>
            <Button
              asChild
              className="rounded-none h-10 font-mono tracking-widest text-[10px] uppercase"
            >
              <a href="/equipe">Ir para Equipe →</a>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto scrollbar-thin border border-[var(--color-hairline)] bg-[var(--color-background)]">
          <div
            className="grid sticky top-0 z-20 bg-[var(--color-background)] border-b border-[var(--color-hairline)]"
            style={{
              gridTemplateColumns: `60px 140px repeat(${equipe.length}, minmax(160px, 1fr))`,
            }}
          >
            <div />
            <div className="p-3 font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)] border-l border-[var(--color-hairline)]">
              Fila de espera
            </div>
            {equipe.map((b) => (
              <div
                key={b.id}
                className="p-3 border-l border-[var(--color-hairline)] flex items-center gap-2"
              >
                <div
                  className="size-8 flex items-center justify-center text-white text-xs font-medium shrink-0 overflow-hidden"
                  style={{ backgroundColor: b.cor }}
                >
                  {b.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.foto_url}
                      alt={b.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    b.nome.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{b.nome}</p>
                  <p className="font-mono text-[9px] tracking-widest uppercase text-[var(--color-muted)]">
                    {b.cargo}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="grid relative"
            style={{
              gridTemplateColumns: `60px 140px repeat(${equipe.length}, minmax(160px, 1fr))`,
            }}
          >
            <div className="border-r border-[var(--color-hairline)]">
              {slots.map((s, i) => (
                <div
                  key={i}
                  className={cn(
                    "px-2 font-mono text-[9px] tracking-wider text-[var(--color-muted)] flex items-start justify-end pt-0.5",
                    s.minuto === 0 ? "" : "opacity-0"
                  )}
                  style={{ height: SLOT_HEIGHT }}
                >
                  {s.minuto === 0 ? `${String(s.hora).padStart(2, "0")}` : ""}
                </div>
              ))}
            </div>

            <FilaEsperaPainel fila={fila} clientes={clientes} />

            {equipe.map((b) => {
              const items = porBarbeiro.get(b.id) ?? [];
              return (
                <div
                  key={b.id}
                  className="border-r border-[var(--color-hairline)] relative"
                >
                  {slots.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => abrirSlot(b.id, i)}
                      className={cn(
                        "block w-full hover:bg-[var(--color-primary)]/5 transition-colors",
                        s.minuto === 0
                          ? "border-t border-[var(--color-hairline)]"
                          : "border-t border-dashed border-[var(--color-hairline)]/50"
                      )}
                      style={{ height: SLOT_HEIGHT }}
                    />
                  ))}

                  {items.map((a) => {
                    const inicio = new Date(a.inicio);
                    const fim = new Date(a.fim);
                    const minDoTopo =
                      (inicio.getHours() - horaInicio) * 60 +
                      inicio.getMinutes();
                    const duracao =
                      (fim.getTime() - inicio.getTime()) / (1000 * 60);
                    const top = (minDoTopo / SLOT_MIN) * SLOT_HEIGHT;
                    const altura = (duracao / SLOT_MIN) * SLOT_HEIGHT;
                    const cliente = a.cliente_id
                      ? clientesMap.get(a.cliente_id)
                      : null;
                    const matchBusca =
                      !busca ||
                      cliente?.nome
                        .toLowerCase()
                        .includes(busca.toLowerCase());

                    return (
                      <AgendamentoCard
                        key={a.id}
                        top={top}
                        altura={altura}
                        cor={b.cor}
                        nome={cliente?.nome ?? "Cliente"}
                        inicio={inicio}
                        fim={fim}
                        status={a.status}
                        valorTotal={
                          a.valor_total ? formatBRL(Number(a.valor_total)) : null
                        }
                        dim={!matchBusca}
                        onClick={() => setCardAbertoId(a.id)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <NovoAgendamentoDialog
        open={openNovo}
        onOpenChange={setOpenNovo}
        equipe={equipe}
        servicos={servicos}
        clientes={clientes}
        slotInicial={slotInicial}
      />

      {atendimentoCard && (
        <ClienteCardDialog
          open={!!cardAbertoId}
          onOpenChange={(v) => !v && setCardAbertoId(null)}
          atendimento={atendimentoCard}
          cliente={clienteCard}
          niveis={niveis}
          servicos={servicos}
          fptsRegras={fptsRegras}
          onFecharConta={() => {
            setCardAbertoId(null);
            setFechandoId(atendimentoCard.id);
          }}
        />
      )}

      {atendimentoFechando && (
        <FecharContaDialog
          open={!!fechandoId}
          onOpenChange={(v) => !v && setFechandoId(null)}
          atendimentoId={atendimentoFechando.id}
          clienteNome={clienteFechando?.nome ?? null}
          valorBase={Number.parseFloat(atendimentoFechando.valor_total ?? "0")}
          cashbackFpts={clienteFechando?.cashback_fpts ?? 0}
          cashbackRegra={cashbackRegra}
          produtosDisponiveis={produtos}
          clienteNivelNumero={clienteNivelNumero}
        />
      )}
    </div>
  );
}
