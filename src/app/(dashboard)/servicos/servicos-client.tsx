"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Scissors } from "lucide-react";
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
import { criarServico, atualizarServico, deletarServico } from "./actions";
import { formatBRL } from "@/lib/utils";
import { Eyebrow, DoubleRule } from "@/components/editorial";
import type { CatalogoServico } from "@/infrastructure/database/types";

export function ServicosClient({ servicos }: { servicos: CatalogoServico[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogoServico | null>(null);

  return (
    <div className="space-y-6">
      <header>
        <DoubleRule />
        <div className="py-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow marker className="mb-2">
              Catálogo · Serviços
            </Eyebrow>
            <h1 className="display-serif text-3xl sm:text-4xl leading-tight">
              Quem volta mais,{" "}
              <em className="display-italic">paga menos.</em>
            </h1>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="self-start sm:self-end rounded-none h-9 font-mono tracking-widest text-[10px] uppercase"
          >
            <Plus className="size-3.5" /> Novo
          </Button>
        </div>
        <DoubleRule />
      </header>

      {servicos.length === 0 ? (
        <div className="hairline-t hairline-b py-16 text-center space-y-3">
          <Scissors className="size-8 mx-auto text-[var(--color-muted-foreground)]" />
          <p className="display-serif text-2xl">
            Catálogo <em className="display-italic">vazio.</em>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--color-hairline)] border border-[var(--color-hairline)]">
          {servicos.map((s) => (
            <div
              key={s.id}
              className={`bg-[var(--color-background)] p-5 ${s.ativo ? "" : "opacity-50"}`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <p className="display-serif text-xl truncate">{s.nome}</p>
                  <p className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)] mt-1 tabular-nums">
                    {s.duracao_min} min · serviço
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditing(s);
                    setOpen(true);
                  }}
                  className="rounded-none border border-transparent hover:border-[var(--color-hairline)]"
                >
                  <Pencil className="size-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-px bg-[var(--color-hairline)]">
                <PrecoBox label="Quinzenal" valor={s.preco_quinzenal} highlight />
                <PrecoBox label="Mensal" valor={s.preco_mensal} />
                <PrecoBox label="Eventual" valor={s.preco_eventual} />
              </div>
            </div>
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
  valor: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-[var(--color-background)] p-3 ${
        highlight ? "bg-[var(--color-primary)]/5" : ""
      }`}
    >
      <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-[var(--color-muted)]">
        {label}
      </p>
      <p
        className={`font-mono tabular-nums text-sm mt-1 ${
          highlight ? "text-[var(--color-primary)]" : ""
        }`}
      >
        {formatBRL(valor)}
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
  editing: CatalogoServico | null;
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

  async function onDelete() {
    if (!editing) return;
    if (!confirm(`Apagar "${editing.nome}"?`)) return;
    startTransition(async () => {
      try {
        await deletarServico(editing.id);
        toast.success("Serviço apagado");
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao apagar");
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
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              name="descricao"
              defaultValue={editing?.descricao ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="duracao_min">Duração (min)</Label>
              <Input
                id="duracao_min"
                name="duracao_min"
                type="number"
                min="5"
                step="5"
                defaultValue={editing?.duracao_min ?? 45}
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
                  name="preco_quinzenal"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.preco_quinzenal ?? 0}
                  required
                />
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted)] mb-1">Mensal</p>
                <Input
                  name="preco_mensal"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.preco_mensal ?? 0}
                  required
                />
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted)] mb-1">
                  Eventual
                </p>
                <Input
                  name="preco_eventual"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.preco_eventual ?? 0}
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between gap-2 pt-2">
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onDelete}
                disabled={pending}
                className="text-[var(--color-destructive)]"
              >
                <Trash2 className="size-4" /> Apagar
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
