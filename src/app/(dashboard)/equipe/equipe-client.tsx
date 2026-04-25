"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, UserCircle } from "lucide-react";
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
import { criarPessoa, atualizarPessoa } from "./actions";
import { FotoUpload } from "@/components/foto-upload";
import { Eyebrow, DoubleRule } from "@/components/editorial";
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
      <header>
        <DoubleRule />
        <div className="py-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow marker className="mb-2">
              Catálogo · Equipe
            </Eyebrow>
            <h1 className="display-serif text-3xl sm:text-4xl">
              Quem corta, quem <em className="display-italic">gere.</em>
            </h1>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-end">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)] tabular-nums">
              {equipe.length.toString().padStart(2, "0")}{" "}
              <span className="text-[var(--color-muted-foreground)]">pessoas</span>
            </p>
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="rounded-none h-9 font-mono tracking-widest text-[10px] uppercase"
            >
              <Plus className="size-3.5" /> Nova
            </Button>
          </div>
        </div>
        <DoubleRule />
      </header>

      {equipe.length === 0 ? (
        <div className="hairline-t hairline-b py-16 text-center space-y-4">
          <UserCircle className="size-8 mx-auto text-[var(--color-muted-foreground)]" />
          <p className="display-serif text-2xl">
            Nenhuma <em className="display-italic">pessoa cadastrada.</em>
          </p>
        </div>
      ) : (
        <ul className="hairline-t hairline-b">
          {equipe.map((p) => (
            <li
              key={p.id}
              className={`hairline-b last:border-b-0 ${p.ativo ? "" : "opacity-50"}`}
            >
              <button
                onClick={() => {
                  setEditing(p);
                  setOpen(true);
                }}
                className="w-full text-left px-1 py-3 sm:py-4 flex items-center gap-4 transition-all hover:px-3 hover:bg-[var(--color-surface)]/40"
              >
                <div
                  className="size-11 flex items-center justify-center text-white font-display text-lg shrink-0"
                  style={{ backgroundColor: p.cor }}
                >
                  {p.nome.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="font-medium truncate">{p.nome}</p>
                    <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-[var(--color-primary)] shrink-0">
                      {CARGO_LABEL[p.cargo]}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)] mt-0.5 truncate">
                    {p.email}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono tabular-nums text-sm">
                    {Number.parseFloat(p.comissao_pct).toFixed(0)}%
                  </p>
                  <p className="font-mono text-[9px] tracking-widest uppercase text-[var(--color-muted)] mt-0.5">
                    Comissão
                  </p>
                </div>
                <Pencil className="size-3.5 text-[var(--color-muted)] shrink-0 hidden sm:block" />
              </button>
            </li>
          ))}
        </ul>
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
  const [fotoUrl, setFotoUrl] = useState<string | null>(editing?.foto_url ?? null);

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
            <Label>Foto</Label>
            <FotoUpload
              value={fotoUrl}
              onChange={setFotoUrl}
              hiddenInputName="foto_url"
            />
          </div>
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
