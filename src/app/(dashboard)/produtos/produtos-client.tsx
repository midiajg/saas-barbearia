"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Package, Trash2 } from "lucide-react";
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
import { criarProduto, atualizarProduto, deletarProduto } from "./actions";
import { formatBRL } from "@/lib/utils";
import { Eyebrow, DoubleRule } from "@/components/editorial";
import type { CatalogoProduto, Nivel } from "@/infrastructure/database/types";

export function ProdutosClient({
  produtos,
  niveis,
}: {
  produtos: CatalogoProduto[];
  niveis: Nivel[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogoProduto | null>(null);

  return (
    <div className="space-y-6">
      <header>
        <DoubleRule />
        <div className="py-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow marker className="mb-2">
              Catálogo · Produtos
            </Eyebrow>
            <h1 className="display-serif text-3xl sm:text-4xl leading-tight">
              Vendido <em className="display-italic">na cadeira.</em>
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

      {produtos.length === 0 ? (
        <div className="hairline-t hairline-b py-16 text-center space-y-3">
          <Package className="size-8 mx-auto text-[var(--color-muted-foreground)]" />
          <p className="display-serif text-2xl">
            Catálogo <em className="display-italic">vazio.</em>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--color-hairline)] border border-[var(--color-hairline)]">
          {produtos.map((p) => (
            <div
              key={p.id}
              className={`bg-[var(--color-background)] p-5 ${p.ativo ? "" : "opacity-50"}`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <p className="display-serif text-xl truncate leading-tight">
                    {p.nome}
                  </p>
                  {p.descricao && (
                    <p className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)] mt-1 truncate">
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
                  className="rounded-none border border-transparent hover:border-[var(--color-hairline)]"
                >
                  <Pencil className="size-3.5" />
                </Button>
              </div>

              <div className="hairline-t hairline-b py-3 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)]">
                    Preço
                  </span>
                  <span className="font-mono tabular-nums text-base text-[var(--color-primary)]">
                    {formatBRL(p.preco)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)]">
                    Estoque
                  </span>
                  <span
                    className={`font-mono tabular-nums text-sm ${
                      p.estoque === 0
                        ? "text-[var(--color-destructive)]"
                        : p.estoque < 5
                          ? "text-[var(--color-warning)]"
                          : ""
                    }`}
                  >
                    {p.estoque} un.
                  </span>
                </div>
              </div>

              {p.desconto_por_nivel &&
                Object.keys(p.desconto_por_nivel).length > 0 && (
                  <div className="mt-3">
                    <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-[var(--color-muted)] mb-2">
                      Desconto · por nível
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(p.desconto_por_nivel).map(
                        ([nivel, pct]) => (
                          <span
                            key={nivel}
                            className="font-mono text-[10px] tracking-widest tabular-nums px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          >
                            N{nivel} · {pct}%
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      <ProdutoDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        niveis={niveis}
      />
    </div>
  );
}

function ProdutoDialog({
  open,
  onOpenChange,
  editing,
  niveis,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: CatalogoProduto | null;
  niveis: Nivel[];
}) {
  const [pending, startTransition] = useTransition();
  const [descontos, setDescontos] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    for (const n of niveis) {
      base[String(n.numero)] = String(
        editing?.desconto_por_nivel?.[String(n.numero)] ?? 0
      );
    }
    return base;
  });

  function handleSubmit(formData: FormData) {
    const descontoObj: Record<string, number> = {};
    for (const [k, v] of Object.entries(descontos)) {
      const n = Number.parseFloat(v);
      if (!Number.isNaN(n) && n > 0) descontoObj[k] = n;
    }
    if (Object.keys(descontoObj).length > 0) {
      formData.set("descontoPorNivel", JSON.stringify(descontoObj));
    }

    startTransition(async () => {
      try {
        if (editing) {
          await atualizarProduto(editing.id, formData);
          toast.success("Produto atualizado");
        } else {
          await criarProduto(formData);
          toast.success("Produto criado");
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
        await deletarProduto(editing.id);
        toast.success("Produto apagado");
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar produto" : "Novo produto"}
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
              <Label htmlFor="estoque">Estoque</Label>
              <Input
                id="estoque"
                name="estoque"
                type="number"
                min="0"
                step="1"
                defaultValue={editing?.estoque ?? 0}
                required
              />
            </div>
          </div>

          {niveis.length > 0 && (
            <div className="space-y-2">
              <Label>Desconto por nível (%)</Label>
              <div className="grid grid-cols-2 gap-2">
                {niveis.map((n) => (
                  <div key={n.numero} className="flex items-center gap-2">
                    <span className="text-xs w-12 text-[var(--color-muted)]">
                      N{n.numero}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={descontos[String(n.numero)] ?? "0"}
                      onChange={(e) =>
                        setDescontos((prev) => ({
                          ...prev,
                          [String(n.numero)]: e.target.value,
                        }))
                      }
                    />
                    <span className="text-xs text-[var(--color-muted)]">%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
