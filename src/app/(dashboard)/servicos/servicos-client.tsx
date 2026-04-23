"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil } from "lucide-react";
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
import { toast } from "sonner";
import { criarServico, atualizarServico } from "./actions";
import { formatBRL } from "@/lib/utils";
import type { Servico } from "@/infrastructure/database/schema";

export function ServicosClient({ servicos }: { servicos: Servico[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Servico | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display">Serviços</h1>
          <p className="text-[var(--color-muted)]">
            Catálogo com 3 preços: quem volta mais, paga menos
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Novo serviço
        </Button>
      </div>

      {servicos.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-[var(--color-muted)]">
              Nenhum serviço cadastrado ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servicos.map((s) => (
            <Card key={s.id} className={s.ativo ? "" : "opacity-50"}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium">{s.nome}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {s.duracaoMin} min
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(s);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <PrecoBox label="Quinzenal" valor={s.precoQuinzenal} highlight />
                  <PrecoBox label="Mensal" valor={s.precoMensal} />
                  <PrecoBox label="Eventual" valor={s.precoEventual} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServicoDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function PrecoBox({
  label,
  valor,
  highlight,
}: {
  label: string;
  valor: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-2 rounded-md border ${
        highlight
          ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5"
          : "border-[var(--color-border)]"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </p>
      <p
        className={`font-medium ${
          highlight ? "text-[var(--color-primary)]" : ""
        }`}
      >
        {formatBRL(Number.parseFloat(valor))}
      </p>
    </div>
  );
}

function ServicoDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Servico | null;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (editing) {
          await atualizarServico(editing.id, formData);
          toast.success("Serviço atualizado");
        } else {
          await criarServico(formData);
          toast.success("Serviço criado");
        }
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao salvar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar serviço" : "Novo serviço"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={editing?.nome} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="duracaoMin">Duração (min)</Label>
              <Input
                id="duracaoMin"
                name="duracaoMin"
                type="number"
                min="5"
                step="5"
                defaultValue={editing?.duracaoMin ?? 45}
                required
              />
            </div>
            {editing && (
              <div className="flex items-center gap-2 self-end pb-2">
                <input
                  type="checkbox"
                  id="ativo"
                  name="ativo"
                  defaultChecked={editing.ativo}
                  className="size-4"
                />
                <Label htmlFor="ativo">Ativo</Label>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Preços por frequência</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-[var(--color-muted)] mb-1">
                  Quinzenal
                </p>
                <Input
                  name="precoQuinzenal"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.precoQuinzenal ?? "0"}
                  required
                />
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted)] mb-1">Mensal</p>
                <Input
                  name="precoMensal"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.precoMensal ?? "0"}
                  required
                />
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted)] mb-1">
                  Eventual
                </p>
                <Input
                  name="precoEventual"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.precoEventual ?? "0"}
                  required
                />
              </div>
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              Cliente que volta a cada 15 dias paga menos. A cada 30, intermediário.
              Mais de 45, eventual.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
