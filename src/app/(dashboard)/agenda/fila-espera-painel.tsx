"use client";

import { useState, useTransition } from "react";
import { Plus, X, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adicionarFila, removerFila } from "./fila-actions";
import type { Cliente, FilaItem } from "@/infrastructure/database/types";

export function FilaEsperaPainel({
  fila,
  clientes,
}: {
  fila: FilaItem[];
  clientes: Cliente[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [busca, setBusca] = useState("");
  const [obs, setObs] = useState("");

  const clientesMap = new Map(clientes.map((c) => [c.id, c]));
  const sugestoes =
    busca.length >= 2
      ? clientes
          .filter(
            (c) =>
              c.nome.toLowerCase().includes(busca.toLowerCase()) ||
              c.telefone?.includes(busca)
          )
          .slice(0, 5)
      : [];

  function adicionar(clienteId: string) {
    startTransition(async () => {
      try {
        await adicionarFila({
          cliente_id: clienteId,
          observacao: obs || undefined,
        });
        toast.success("Cliente na fila");
        setOpen(false);
        setBusca("");
        setObs("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function remover(id: string) {
    startTransition(async () => {
      await removerFila(id);
    });
  }

  return (
    <div className="border-r border-[var(--color-border)] bg-[var(--color-background)]/30 p-2 space-y-2 overflow-auto">
      <button
        onClick={() => setOpen(true)}
        className="w-full p-2 rounded-md border border-dashed border-[var(--color-border)] text-xs text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] flex items-center justify-center gap-1"
      >
        <Plus className="size-3" />
        Adicionar à fila
      </button>

      {fila.length === 0 ? (
        <p className="text-xs text-[var(--color-muted)] italic text-center pt-2">
          Vazia
        </p>
      ) : (
        fila.map((f) => {
          const cliente = clientesMap.get(f.cliente_id);
          const minDecorridos = Math.floor(
            (Date.now() - new Date(f.criado_em).getTime()) / 60000
          );
          return (
            <div
              key={f.id}
              className="p-2 rounded-md border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 text-xs space-y-1"
            >
              <div className="flex items-start justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <User className="size-3 shrink-0 text-[var(--color-primary)]" />
                  <span className="font-medium truncate">
                    {cliente?.nome ?? "Cliente"}
                  </span>
                </div>
                <button
                  onClick={() => remover(f.id)}
                  disabled={pending}
                  className="text-[var(--color-muted)] hover:text-[var(--color-destructive)]"
                >
                  <X className="size-3" />
                </button>
              </div>
              {f.observacao && (
                <p className="text-[var(--color-muted)] italic">
                  {f.observacao}
                </p>
              )}
              <p className="text-[10px] text-[var(--color-muted)]">
                aguarda {minDecorridos}min
              </p>
            </div>
          );
        })
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar à fila de espera</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              {sugestoes.length > 0 && (
                <div className="border border-[var(--color-border)] rounded-md max-h-40 overflow-auto">
                  {sugestoes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => adicionar(c.id)}
                      disabled={pending}
                      className="block w-full text-left p-2 text-sm hover:bg-[var(--color-surface-hover)]"
                    >
                      {c.nome}
                      {c.telefone && (
                        <span className="text-xs text-[var(--color-muted)] ml-2">
                          {c.telefone}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Input
                placeholder="Ex: cabelo + barba"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
              />
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              Selecione um cliente acima pra adicionar.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
