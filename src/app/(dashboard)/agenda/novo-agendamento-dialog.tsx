"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { criarAtendimentoAction } from "./actions";
import { formatBRL } from "@/lib/utils";
import type {
  CatalogoServico,
  Cliente,
  Equipe,
} from "@/infrastructure/database/types";

export function NovoAgendamentoDialog({
  open,
  onOpenChange,
  equipe,
  servicos,
  clientes,
  slotInicial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  equipe: Equipe[];
  servicos: CatalogoServico[];
  clientes: Cliente[];
  slotInicial: { barbeiroId: string; inicio: Date } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [barbeiroId, setBarbeiroId] = useState("");
  const [clienteBusca, setClienteBusca] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [servicoIds, setServicoIds] = useState<string[]>([]);
  const [horario, setHorario] = useState("");
  const [data, setData] = useState("");

  useEffect(() => {
    if (open) {
      setBarbeiroId(slotInicial?.barbeiroId ?? equipe[0]?.id ?? "");
      setClienteBusca("");
      setClienteId(null);
      setServicoIds([]);
      const inicio = slotInicial?.inicio ?? new Date();
      setData(inicio.toISOString().slice(0, 10));
      setHorario(
        `${String(inicio.getHours()).padStart(2, "0")}:${String(inicio.getMinutes()).padStart(2, "0")}`
      );
    }
  }, [open, slotInicial, equipe]);

  const clientesFiltrados = useMemo(
    () =>
      clienteBusca.length >= 2
        ? clientes
            .filter(
              (c) =>
                c.nome.toLowerCase().includes(clienteBusca.toLowerCase()) ||
                c.telefone?.includes(clienteBusca)
            )
            .slice(0, 8)
        : [],
    [clienteBusca, clientes]
  );

  const totais = useMemo(() => {
    const selecionados = servicos.filter((s) => servicoIds.includes(s.id));
    const duracao = selecionados.reduce((acc, s) => acc + s.duracao_min, 0);
    const valor = selecionados.reduce((acc, s) => acc + s.preco_eventual, 0);
    return { duracao, valor, selecionados };
  }, [servicoIds, servicos]);

  function toggleServico(id: string) {
    setServicoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function submeter() {
    if (!barbeiroId || servicoIds.length === 0 || !data || !horario) {
      toast.error("Preencha barbeiro, data, horário e ao menos um serviço");
      return;
    }
    startTransition(async () => {
      try {
        await criarAtendimentoAction({
          barbeiroId,
          clienteId,
          data,
          horario,
          servicoIds,
        });
        toast.success("Agendamento criado");
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao agendar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto rounded-none border-[var(--color-hairline)] bg-[var(--color-background)]">
        <DialogHeader className="space-y-3">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)]">
            Novo agendamento · Manual
          </p>
          <div className="h-px bg-[var(--color-foreground)]/40" />
          <DialogTitle className="display-serif text-2xl">
            Marcar <em className="display-italic">novo horário.</em>
          </DialogTitle>
          <DialogDescription className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)]">
            Cliente · Profissional · Serviços
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="eyebrow">Data</Label>
              <Input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-10 rounded-none bg-transparent border-[var(--color-hairline)] focus-visible:border-[var(--color-primary)]"
              />
            </div>
            <div className="space-y-2">
              <Label className="eyebrow">Horário</Label>
              <Input
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                step={60 * 5}
                className="h-10 rounded-none bg-transparent border-[var(--color-hairline)] focus-visible:border-[var(--color-primary)] font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="eyebrow">Profissional</Label>
            <select
              value={barbeiroId}
              onChange={(e) => setBarbeiroId(e.target.value)}
              className="flex h-10 w-full rounded-none border border-[var(--color-hairline)] bg-transparent px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            >
              {equipe.map((b) => (
                <option key={b.id} value={b.id} className="bg-[var(--color-background)]">
                  {b.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="eyebrow">Cliente</Label>
            {clienteId ? (
              <div className="flex items-center justify-between px-3 py-2 border border-[var(--color-hairline)]">
                <span className="text-sm font-medium">
                  {clientes.find((c) => c.id === clienteId)?.nome}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setClienteId(null);
                    setClienteBusca("");
                  }}
                  className="rounded-none font-mono tracking-widest text-[10px] uppercase"
                >
                  Trocar
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Digite ao menos 2 letras..."
                  value={clienteBusca}
                  onChange={(e) => setClienteBusca(e.target.value)}
                  className="h-10 rounded-none bg-transparent border-[var(--color-hairline)] focus-visible:border-[var(--color-primary)]"
                />
                {clientesFiltrados.length > 0 && (
                  <ul className="border border-[var(--color-hairline)] mt-1 max-h-40 overflow-auto">
                    {clientesFiltrados.map((c) => (
                      <li key={c.id} className="hairline-b last:border-b-0">
                        <button
                          onClick={() => {
                            setClienteId(c.id);
                            setClienteBusca(c.nome);
                          }}
                          className="block w-full text-left p-2.5 text-sm hover:bg-[var(--color-surface)] flex items-baseline justify-between gap-3"
                        >
                          <span className="font-medium truncate">{c.nome}</span>
                          {c.telefone && (
                            <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)] shrink-0">
                              {c.telefone}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {clienteBusca.length >= 2 && clientesFiltrados.length === 0 && (
                  <p className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)] italic">
                    Nenhum encontrado · Cadastre em /clientes
                  </p>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label className="eyebrow">Serviços</Label>
            {servicos.length === 0 ? (
              <p className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)] italic">
                Cadastre primeiro em /serviços
              </p>
            ) : (
              <ul className="border border-[var(--color-hairline)] max-h-44 overflow-auto">
                {servicos.map((s) => {
                  const sel = servicoIds.includes(s.id);
                  return (
                    <li key={s.id} className="hairline-b last:border-b-0">
                      <label
                        className={`flex items-center justify-between gap-3 text-sm cursor-pointer p-2.5 transition-colors ${
                          sel ? "bg-[var(--color-primary)]/5" : "hover:bg-[var(--color-surface)]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={sel}
                            onChange={() => toggleServico(s.id)}
                            className="size-4"
                          />
                          <span className="truncate">{s.nome}</span>
                        </div>
                        <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)] tabular-nums shrink-0">
                          {s.duracao_min}min · {formatBRL(s.preco_eventual)}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {totais.selecionados.length > 0 && (
            <div className="hairline-t hairline-b py-3 flex items-baseline justify-between">
              <div>
                <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-[var(--color-muted)]">
                  Subtotal estimado
                </p>
                <p className="font-mono tabular-nums text-sm mt-1">
                  {totais.duracao} min
                </p>
              </div>
              <p className="display-num text-2xl text-[var(--color-primary)] font-light">
                {formatBRL(totais.valor)}
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-none h-11 font-mono tracking-widest text-[10px] uppercase border-[var(--color-hairline)]"
            >
              Cancelar
            </Button>
            <Button
              onClick={submeter}
              disabled={pending}
              className="rounded-none h-11 font-mono tracking-widest text-[10px] uppercase"
            >
              {pending ? "Salvando..." : "Agendar →"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
