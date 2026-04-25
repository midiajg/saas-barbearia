"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
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
import { adicionarBloqueio, removerBloqueio } from "./actions";
import type { Bloqueio, Equipe } from "@/infrastructure/database/types";

export function BloqueiosClient({
  bloqueios,
  equipe,
}: {
  bloqueios: Bloqueio[];
  equipe: Equipe[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const equipeMap = new Map(equipe.map((e) => [e.id, e.nome]));

  function adicionar(formData: FormData) {
    startTransition(async () => {
      try {
        await adicionarBloqueio(formData);
        toast.success("Bloqueio criado");
        setOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function remover(id: string) {
    if (!confirm("Remover este bloqueio?")) return;
    startTransition(async () => {
      await removerBloqueio(id);
      toast.success("Removido");
    });
  }

  // futuros primeiro
  const ordenados = [...bloqueios].sort((a, b) =>
    a.inicio.localeCompare(b.inicio)
  );
  const agora = Date.now();
  const futuros = ordenados.filter((b) => new Date(b.fim).getTime() >= agora);
  const passados = ordenados.filter((b) => new Date(b.fim).getTime() < agora);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display">Bloqueios de horário</h1>
          <p className="text-[var(--color-muted)]">
            Folga, almoço, evento, dia de treinamento
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Novo bloqueio
        </Button>
      </div>

      {futuros.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Calendar className="size-8 mx-auto mb-2 text-[var(--color-muted)]" />
            <p className="text-[var(--color-muted)]">
              Nenhum bloqueio futuro.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {futuros.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {equipeMap.get(b.barbeiro_id) ?? "Equipe"}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {new Date(b.inicio).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" → "}
                    {new Date(b.fim).toLocaleString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {b.motivo && (
                    <p className="text-xs italic text-[var(--color-muted)] mt-1">
                      {b.motivo}
                    </p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => remover(b.id)}
                  disabled={pending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {passados.length > 0 && (
        <details>
          <summary className="text-xs text-[var(--color-muted)] cursor-pointer">
            Histórico ({passados.length})
          </summary>
          <div className="mt-2 space-y-1">
            {passados.map((b) => (
              <div
                key={b.id}
                className="text-xs text-[var(--color-muted)] p-2 border border-[var(--color-border)] rounded"
              >
                {equipeMap.get(b.barbeiro_id)} — {b.motivo ?? "—"} —{" "}
                {new Date(b.inicio).toLocaleDateString("pt-BR")}
              </div>
            ))}
          </div>
        </details>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo bloqueio</DialogTitle>
          </DialogHeader>
          <form action={adicionar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="barbeiro_id">Quem fica indisponível</Label>
              <select
                id="barbeiro_id"
                name="barbeiro_id"
                required
                className="w-full h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                {equipe.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
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
                <Label htmlFor="inicio">Início</Label>
                <Input
                  id="inicio"
                  name="inicio"
                  type="time"
                  required
                  defaultValue="12:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fim">Fim</Label>
                <Input
                  id="fim"
                  name="fim"
                  type="time"
                  required
                  defaultValue="13:00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo (opcional)</Label>
              <Input
                id="motivo"
                name="motivo"
                placeholder="Almoço, folga, treinamento..."
              />
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
