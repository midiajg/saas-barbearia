"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBRL } from "@/lib/utils";
import { adicionarDespesa, togglePago, removerDespesa } from "./actions";
import type { Despesa } from "@/infrastructure/database/types";

const CATEGORIAS = [
  "Aluguel",
  "Produto",
  "Conta (luz, água, internet)",
  "Salário/Comissão",
  "Marketing",
  "Equipamento",
  "Imposto",
  "Outros",
];

export function DespesasClient({ despesas }: { despesas: Despesa[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const total = despesas.reduce((s, d) => s + d.valor, 0);
  const totalPago = despesas
    .filter((d) => d.pago)
    .reduce((s, d) => s + d.valor, 0);
  const totalAberto = total - totalPago;

  const ordenadas = [...despesas].sort((a, b) =>
    b.data.localeCompare(a.data)
  );

  function adicionar(formData: FormData) {
    startTransition(async () => {
      try {
        await adicionarDespesa(formData);
        toast.success("Despesa adicionada");
        setOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function alternar(id: string) {
    startTransition(async () => {
      await togglePago(id);
    });
  }

  function remover(id: string) {
    if (!confirm("Apagar esta despesa?")) return;
    startTransition(async () => {
      await removerDespesa(id);
      toast.success("Removida");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display">Despesas</h1>
          <p className="text-[var(--color-muted)]">
            Tudo que sai do caixa pra calcular lucro real
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Nova despesa
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
              Total
            </p>
            <p className="text-2xl font-display mt-1">{formatBRL(total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
              Pago
            </p>
            <p className="text-2xl font-display mt-1 text-[var(--color-success)]">
              {formatBRL(totalPago)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
              Em aberto
            </p>
            <p className="text-2xl font-display mt-1 text-[var(--color-warning)]">
              {formatBRL(totalAberto)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {ordenadas.length === 0 ? (
            <p className="p-10 text-center text-[var(--color-muted)]">
              Nenhuma despesa registrada.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--color-muted)] uppercase border-b border-[var(--color-border)]">
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Descrição</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3 text-right">Valor</th>
                  <th className="px-5 py-3 text-center">Pago</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {ordenadas.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-5 py-3 whitespace-nowrap">
                      {new Date(d.data + "T00:00:00").toLocaleDateString(
                        "pt-BR"
                      )}
                    </td>
                    <td className="px-5 py-3">{d.descricao}</td>
                    <td className="px-5 py-3 text-xs text-[var(--color-muted)]">
                      {d.categoria}
                    </td>
                    <td className="px-5 py-3 text-right font-medium">
                      {formatBRL(d.valor)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => alternar(d.id)}>
                        {d.pago ? (
                          <Check className="size-4 text-[var(--color-success)] mx-auto" />
                        ) : (
                          <AlertCircle className="size-4 text-[var(--color-warning)] mx-auto" />
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remover(d.id)}
                        disabled={pending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova despesa</DialogTitle>
          </DialogHeader>
          <form action={adicionar} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  name="data"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  name="valor"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                name="descricao"
                placeholder="Ex: Pomada Linha Premium 12un"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <select
                id="categoria"
                name="categoria"
                className="w-full h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                defaultValue="Outros"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pago"
                name="pago"
                className="size-4"
              />
              <Label htmlFor="pago">Já pago</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                Adicionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
