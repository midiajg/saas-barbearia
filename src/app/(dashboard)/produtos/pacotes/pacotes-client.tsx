"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Package2, Infinity as InfIcon } from "lucide-react";
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
import { criarPacote, atualizarPacote, deletarPacote } from "./actions";
import { formatBRL } from "@/lib/utils";
import type {
  CatalogoServico,
  Pacote,
} from "@/infrastructure/database/types";

export function PacotesClient({
  pacotes,
  servicos,
}: {
  pacotes: Pacote[];
  servicos: CatalogoServico[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pacote | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display">Pacotes & Mensalidades</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Crie planos como "5 cortes por R$200" ou "ilimitado mensal por R$150"
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="self-start sm:self-auto"
        >
          <Plus className="size-4" /> Novo pacote
        </Button>
      </div>

      {pacotes.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Package2 className="size-10 mx-auto mb-3 text-[var(--color-muted)]" />
            <p className="text-[var(--color-muted)]">
              Nenhum pacote cadastrado. Crie um pacote pra vender no balcão ou
              oferecer no portal.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pacotes.map((p) => {
            const cobreNomes = p.servicos_inclusos.length
              ? servicos
                  .filter((s) => p.servicos_inclusos.includes(s.id))
                  .map((s) => s.nome)
              : null;
            return (
              <Card key={p.id} className={p.ativo ? "" : "opacity-50"}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.nome}</p>
                      {p.descricao && (
                        <p className="text-xs text-[var(--color-muted)] truncate">
                          {p.descricao}
                        </p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(p);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-[var(--color-muted)]">
                      Preço
                    </span>
                    <span className="text-lg font-semibold text-[var(--color-primary)]">
                      {formatBRL(p.preco)}
                      {p.recorrente && (
                        <span className="text-xs text-[var(--color-muted)] ml-1">
                          /mês
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-[var(--color-muted)]">
                      Usos
                    </span>
                    <span className="text-sm font-medium flex items-center gap-1">
                      {p.quantidade === null ? (
                        <>
                          <InfIcon className="size-3.5" /> ilimitado
                        </>
                      ) : (
                        `${p.quantidade}×`
                      )}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-xs text-[var(--color-muted)]">
                      Validade
                    </span>
                    <span className="text-sm">{p.duracao_dias} dias</span>
                  </div>
                  <div className="pt-3 border-t border-[var(--color-border)]">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">
                      Cobre
                    </p>
                    <p className="text-xs">
                      {cobreNomes
                        ? cobreNomes.join(", ")
                        : "Todos os serviços"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PacoteDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        servicos={servicos}
      />
    </div>
  );
}

function PacoteDialog({
  open,
  onOpenChange,
  editing,
  servicos,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Pacote | null;
  servicos: CatalogoServico[];
}) {
  const [pending, startTransition] = useTransition();
  const [ilimitado, setIlimitado] = useState(editing?.quantidade === null);
  const [recorrente, setRecorrente] = useState(editing?.recorrente ?? false);
  const [servicosSel, setServicosSel] = useState<string[]>(
    editing?.servicos_inclusos ?? []
  );

  function toggle(id: string) {
    setServicosSel((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(formData: FormData) {
    formData.delete("servicos_inclusos");
    for (const id of servicosSel) formData.append("servicos_inclusos", id);
    startTransition(async () => {
      try {
        if (editing) {
          await atualizarPacote(editing.id, formData);
          toast.success("Pacote atualizado");
        } else {
          await criarPacote(formData);
          toast.success("Pacote criado");
        }
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao salvar");
      }
    });
  }

  function onDelete() {
    if (!editing) return;
    if (!confirm(`Apagar pacote "${editing.nome}"?`)) return;
    startTransition(async () => {
      try {
        await deletarPacote(editing.id);
        toast.success("Pacote apagado");
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar pacote" : "Novo pacote"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              placeholder="Ex: 5 cortes mensais"
              defaultValue={editing?.nome}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Input
              id="descricao"
              name="descricao"
              defaultValue={editing?.descricao ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input
                id="preco"
                name="preco"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editing?.preco ?? 0}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duracao_dias">Validade (dias)</Label>
              <Input
                id="duracao_dias"
                name="duracao_dias"
                type="number"
                min="1"
                defaultValue={editing?.duracao_dias ?? 30}
                required
              />
            </div>
          </div>

          <div className="space-y-2 p-3 rounded-md border border-[var(--color-border)]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="ilimitado"
                checked={ilimitado}
                onChange={(e) => setIlimitado(e.target.checked)}
                className="size-4"
              />
              <span className="text-sm font-medium">Usos ilimitados</span>
            </label>
            {!ilimitado && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="quantidade" className="text-xs">
                  Quantidade de usos
                </Label>
                <Input
                  id="quantidade"
                  name="quantidade"
                  type="number"
                  min="1"
                  defaultValue={editing?.quantidade ?? 5}
                />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer p-3 rounded-md border border-[var(--color-border)]">
            <input
              type="checkbox"
              name="recorrente"
              checked={recorrente}
              onChange={(e) => setRecorrente(e.target.checked)}
              className="size-4"
            />
            <span className="text-sm font-medium">
              Mensalidade recorrente
              <span className="text-xs text-[var(--color-muted)] block font-normal">
                Cliente paga sempre que vencer (ainda manual no MVP)
              </span>
            </span>
          </label>

          <div className="space-y-2">
            <Label>Serviços inclusos</Label>
            <p className="text-xs text-[var(--color-muted)]">
              Vazio = pacote cobre TODOS os serviços
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto border border-[var(--color-border)] rounded-md p-2">
              {servicos.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)] p-2">
                  Cadastre serviços primeiro em /serviços
                </p>
              ) : (
                servicos
                  .filter((s) => s.ativo)
                  .map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 cursor-pointer text-sm p-1 rounded hover:bg-[var(--color-surface-hover)]"
                    >
                      <input
                        type="checkbox"
                        checked={servicosSel.includes(s.id)}
                        onChange={() => toggle(s.id)}
                        className="size-4"
                      />
                      <span className="flex-1 truncate">{s.nome}</span>
                      <span className="text-xs text-[var(--color-muted)]">
                        {formatBRL(s.preco_eventual)}
                      </span>
                    </label>
                  ))
              )}
            </div>
          </div>

          {editing && (
            <div className="flex items-center gap-2">
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

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
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
            <div className="flex gap-2 sm:ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending} className="flex-1 sm:flex-none">
                {pending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
