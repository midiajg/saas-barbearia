"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Package, Trash2 } from "lucide-react";
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
import { criarProduto, atualizarProduto, deletarProduto } from "./actions";
import { formatBRL } from "@/lib/utils";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display">Produtos</h1>
          <p className="text-[var(--color-muted)]">
            Catálogo com desconto por nível de fidelidade
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Novo produto
        </Button>
      </div>

      {produtos.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Package className="size-10 mx-auto mb-3 text-[var(--color-muted)]" />
            <p className="text-[var(--color-muted)]">
              Nenhum produto cadastrado ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {produtos.map((p) => (
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
                  <span className="text-xs text-[var(--color-muted)]">Preço</span>
                  <span className="text-lg font-semibold text-[var(--color-primary)]">
                    {formatBRL(p.preco)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-xs text-[var(--color-muted)]">
                    Estoque
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      p.estoque === 0
                        ? "text-[var(--color-destructive)]"
                        : p.estoque < 5
                          ? "text-[var(--color-warning)]"
                          : ""
                    }`}
                  >
                    {p.estoque}
                  </span>
                </div>
                {p.desconto_por_nivel &&
                  Object.keys(p.desconto_por_nivel).length > 0 && (
                    <div className="pt-3 border-t border-[var(--color-border)] space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                        Desconto por nível
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(p.desconto_por_nivel).map(
                          ([nivel, pct]) => (
                            <span
                              key={nivel}
                              className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                            >
                              N{nivel}: {pct}%
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
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
