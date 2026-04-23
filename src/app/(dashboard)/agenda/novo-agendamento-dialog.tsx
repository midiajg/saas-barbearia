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
import { criarAgendamentoAction } from "./actions";
import { formatBRL } from "@/lib/utils";
import type { Barbeiro, Servico, Cliente } from "@/infrastructure/database/schema";

export function NovoAgendamentoDialog({
  open,
  onOpenChange,
  barbeiros,
  servicos,
  clientes,
  slotInicial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  barbeiros: Barbeiro[];
  servicos: Servico[];
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
      setBarbeiroId(slotInicial?.barbeiroId ?? barbeiros[0]?.id ?? "");
      setClienteBusca("");
      setClienteId(null);
      setServicoIds([]);
      const inicio = slotInicial?.inicio ?? new Date();
      setData(inicio.toISOString().slice(0, 10));
      setHorario(
        `${String(inicio.getHours()).padStart(2, "0")}:${String(inicio.getMinutes()).padStart(2, "0")}`
      );
    }
  }, [open, slotInicial, barbeiros]);

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
    const valor = selecionados.reduce(
      (acc, s) => acc + Number.parseFloat(s.preco_eventual),
      0
    );
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
        await criarAgendamentoAction({
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>
            Selecione cliente, barbeiro e serviços
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Data</Label>
              <Input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Horário</Label>
              <Input
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                step={60 * 5}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Barbeiro</Label>
            <select
              value={barbeiroId}
              onChange={(e) => setBarbeiroId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
            >
              {barbeiros.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Cliente</Label>
            {clienteId ? (
              <div className="flex items-center justify-between p-2 rounded-md border border-[var(--color-border)]">
                <span className="text-sm">
                  {clientes.find((c) => c.id === clienteId)?.nome}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setClienteId(null);
                    setClienteBusca("");
                  }}
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
                />
                {clientesFiltrados.length > 0 && (
                  <div className="border border-[var(--color-border)] rounded-md mt-1 max-h-40 overflow-auto">
                    {clientesFiltrados.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setClienteId(c.id);
                          setClienteBusca(c.nome);
                        }}
                        className="block w-full text-left p-2 text-sm hover:bg-[var(--color-surface-hover)]"
                      >
                        {c.nome}
                        {c.telefone && (
                          <span className="text-[var(--color-muted)] ml-2 text-xs">
                            {c.telefone}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {clienteBusca.length >= 2 && clientesFiltrados.length === 0 && (
                  <p className="text-xs text-[var(--color-muted)]">
                    Nenhum cliente encontrado. Cadastre em /clientes (ou continue
                    sem cliente).
                  </p>
                )}
              </>
            )}
          </div>

          <div className="space-y-1">
            <Label>Serviços</Label>
            {servicos.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)]">
                Cadastre serviços primeiro em /servicos
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-1 max-h-40 overflow-auto p-2 border border-[var(--color-border)] rounded-md">
                {servicos.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center justify-between gap-2 text-sm cursor-pointer hover:bg-[var(--color-surface-hover)] p-1 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={servicoIds.includes(s.id)}
                        onChange={() => toggleServico(s.id)}
                        className="size-4"
                      />
                      <span>{s.nome}</span>
                    </div>
                    <span className="text-xs text-[var(--color-muted)]">
                      {s.duracao_min}min ·{" "}
                      {formatBRL(Number.parseFloat(s.preco_eventual))}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {totais.selecionados.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-md bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 text-sm">
              <div>
                <p className="text-[var(--color-muted)] text-xs">
                  Duração estimada
                </p>
                <p className="font-medium">{totais.duracao} min</p>
              </div>
              <div className="text-right">
                <p className="text-[var(--color-muted)] text-xs">
                  Valor estimado
                </p>
                <p className="font-medium text-[var(--color-primary)]">
                  {formatBRL(totais.valor)}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={submeter} disabled={pending}>
              {pending ? "Salvando..." : "Agendar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
