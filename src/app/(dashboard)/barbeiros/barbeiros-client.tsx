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
import { criarBarbeiro, atualizarBarbeiro } from "./actions";
import type { Servico } from "@/infrastructure/database/schema";

type BarbeiroComServicos = import("@/infrastructure/database/types").Barbeiro & {
  servicoIds: string[];
};

export function BarbeirosClient({
  barbeiros,
  servicos,
}: {
  barbeiros: BarbeiroComServicos[];
  servicos: Servico[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BarbeiroComServicos | null>(null);

  function abrirNovo() {
    setEditing(null);
    setOpen(true);
  }

  function abrirEdicao(b: BarbeiroComServicos) {
    setEditing(b);
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display">Barbeiros</h1>
          <p className="text-[var(--color-muted)]">
            Quem atende na sua barbearia
          </p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="size-4" /> Novo barbeiro
        </Button>
      </div>

      {barbeiros.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-[var(--color-muted)] mb-4">
              Nenhum barbeiro cadastrado ainda.
            </p>
            <Button onClick={abrirNovo}>
              <Plus className="size-4" /> Criar primeiro barbeiro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {barbeiros.map((b) => (
            <Card key={b.id} className={b.ativo ? "" : "opacity-50"}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="size-12 rounded-full flex items-center justify-center text-white font-medium shrink-0"
                    style={{ backgroundColor: b.cor }}
                  >
                    {b.nome.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{b.nome}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {b.percentual_comissao}% de comissão
                    </p>
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      {b.servicoIds.length} serviço(s)
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => abrirEdicao(b)}>
                    <Pencil className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BarbeiroDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        servicos={servicos}
      />
    </div>
  );
}

function BarbeiroDialog({
  open,
  onOpenChange,
  editing,
  servicos,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: BarbeiroComServicos | null;
  servicos: Servico[];
}) {
  const [pending, startTransition] = useTransition();
  const [selecionados, setSelecionados] = useState<string[]>(
    editing?.servicoIds ?? []
  );

  function toggleServico(id: string) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(formData: FormData) {
    formData.set("servicoIds", JSON.stringify(selecionados));
    startTransition(async () => {
      try {
        if (editing) {
          await atualizarBarbeiro(editing.id, formData);
          toast.success("Barbeiro atualizado");
        } else {
          await criarBarbeiro(formData);
          toast.success("Barbeiro criado");
        }
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao salvar");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setSelecionados(editing?.servicoIds ?? []);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar barbeiro" : "Novo barbeiro"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={editing?.nome} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cor">Cor no grid</Label>
              <Input
                id="cor"
                name="cor"
                type="color"
                defaultValue={editing?.cor ?? "#45D4C0"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentualComissao">Comissão %</Label>
              <Input
                id="percentualComissao"
                name="percentualComissao"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={editing?.percentual_comissao ?? "50.00"}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fotoUrl">Foto (URL)</Label>
            <Input
              id="fotoUrl"
              name="fotoUrl"
              type="url"
              defaultValue={editing?.foto_url ?? ""}
              placeholder="https://..."
            />
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

          <div className="space-y-2">
            <Label>Serviços que faz</Label>
            {servicos.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)]">
                Cadastre serviços primeiro em /servicos
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto p-2 border border-[var(--color-border)] rounded-md">
                {servicos.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selecionados.includes(s.id)}
                      onChange={() => toggleServico(s.id)}
                      className="size-4"
                    />
                    <span className="truncate">{s.nome}</span>
                  </label>
                ))}
              </div>
            )}
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
