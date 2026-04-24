"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, UserCircle } from "lucide-react";
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
import { criarPessoa, atualizarPessoa } from "./actions";
import type { Cargo, Equipe } from "@/infrastructure/database/types";

const CARGO_LABEL: Record<Cargo, string> = {
  dono: "Dono",
  gerente: "Gerente",
  barbeiro: "Barbeiro",
};

export function EquipeClient({ equipe }: { equipe: Equipe[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Equipe | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display">Equipe</h1>
          <p className="text-[var(--color-muted)]">
            Barbeiros, gerentes e donos que atendem ou acessam o sistema
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Nova pessoa
        </Button>
      </div>

      {equipe.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <UserCircle className="size-10 mx-auto mb-3 text-[var(--color-muted)]" />
            <p className="text-[var(--color-muted)]">Ninguém cadastrado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipe.map((p) => (
            <Card key={p.id} className={p.ativo ? "" : "opacity-50"}>
              <CardContent className="p-5 flex items-start gap-3">
                <div
                  className="size-12 rounded-full flex items-center justify-center text-white font-medium shrink-0"
                  style={{ backgroundColor: p.cor }}
                >
                  {p.nome.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.nome}</p>
                  <p className="text-xs text-[var(--color-muted)] truncate">
                    {p.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                      {CARGO_LABEL[p.cargo]}
                    </span>
                    <span className="text-xs text-[var(--color-muted)]">
                      {Number.parseFloat(p.comissao_pct).toFixed(0)}% comissão
                    </span>
                  </div>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PessoaDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function PessoaDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Equipe | null;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (editing) {
          await atualizarPessoa(editing.id, formData);
          toast.success("Atualizado");
        } else {
          await criarPessoa(formData);
          toast.success("Cadastrado");
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
          <DialogTitle>{editing ? "Editar pessoa" : "Nova pessoa"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={editing?.nome} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={editing?.email}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <select
                id="cargo"
                name="cargo"
                defaultValue={editing?.cargo ?? "barbeiro"}
                className="w-full h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                <option value="dono">Dono</option>
                <option value="gerente">Gerente</option>
                <option value="barbeiro">Barbeiro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cor">Cor (agenda)</Label>
              <Input
                id="cor"
                name="cor"
                type="color"
                defaultValue={editing?.cor ?? "#45D4C0"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comissao">% comissão</Label>
              <Input
                id="comissao"
                name="comissao"
                type="number"
                min="0"
                max="100"
                step="1"
                defaultValue={
                  editing
                    ? Number.parseFloat(editing.comissao_pct).toFixed(0)
                    : "50"
                }
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">
              {editing ? "Nova senha (opcional)" : "Senha"}
            </Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              autoComplete="new-password"
              minLength={editing ? 0 : 8}
              placeholder={editing ? "Deixe vazio pra manter" : "Mínimo 8"}
              required={!editing}
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
