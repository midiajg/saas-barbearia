"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Coins, Check, Plus, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatBRL } from "@/lib/utils";
import { fecharConta } from "@/application/fechar-conta";
import { calcularAbateMaximo } from "@/domain/cashback";
import type {
  CashbackRegra,
  CatalogoProduto,
  FormaPagamento,
} from "@/infrastructure/database/types";

const FORMAS: { value: FormaPagamento; label: string }[] = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "cartao_debito", label: "Débito" },
  { value: "cartao_credito", label: "Crédito" },
  { value: "fiado", label: "Fiado" },
];

type ProdutoSelecionado = {
  produto: CatalogoProduto;
  quantidade: number;
  precoComDesconto: number;
};

function precoComDescontoDeNivel(
  p: CatalogoProduto,
  nivelNumero: number | null
): number {
  if (nivelNumero == null || !p.desconto_por_nivel) return p.preco;
  const pct = p.desconto_por_nivel[String(nivelNumero)] ?? 0;
  if (pct <= 0) return p.preco;
  return Math.round(p.preco * (1 - pct / 100) * 100) / 100;
}

export function FecharContaDialog({
  open,
  onOpenChange,
  atendimentoId,
  clienteNome,
  valorBase,
  cashbackFpts,
  cashbackRegra,
  produtosDisponiveis,
  clienteNivelNumero,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  atendimentoId: string;
  clienteNome: string | null;
  valorBase: number;
  cashbackFpts: number;
  cashbackRegra: CashbackRegra;
  produtosDisponiveis: CatalogoProduto[];
  clienteNivelNumero: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const [usarCashback, setUsarCashback] = useState(false);
  const [descontoExtra, setDescontoExtra] = useState("0");
  const [produtosSel, setProdutosSel] = useState<ProdutoSelecionado[]>([]);
  const [buscaProduto, setBuscaProduto] = useState("");

  const valorProdutos = useMemo(
    () =>
      produtosSel.reduce(
        (acc, p) => acc + p.precoComDesconto * p.quantidade,
        0
      ),
    [produtosSel]
  );

  const descontoExtraNum = Number.parseFloat(descontoExtra) || 0;
  const valorTotal = valorBase + valorProdutos;
  const valorComDescontoExtra = Math.max(0, valorTotal - descontoExtraNum);

  const preview = useMemo(() => {
    if (!usarCashback || cashbackFpts <= 0) return { reais: 0, fpts: 0 };
    return calcularAbateMaximo(
      cashbackFpts,
      valorComDescontoExtra,
      cashbackRegra
    );
  }, [usarCashback, cashbackFpts, valorComDescontoExtra, cashbackRegra]);

  const valorFinal = Math.max(0, valorComDescontoExtra - preview.reais);
  const saldoEmReais =
    Math.floor((cashbackFpts / cashbackRegra.fpts_por_real) * 100) / 100;

  const produtosFiltrados = useMemo(() => {
    if (!buscaProduto) return produtosDisponiveis.slice(0, 6);
    const q = buscaProduto.toLowerCase();
    return produtosDisponiveis
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.descricao?.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [produtosDisponiveis, buscaProduto]);

  function adicionarProduto(p: CatalogoProduto) {
    if (p.estoque <= 0) {
      toast.error(`"${p.nome}" sem estoque`);
      return;
    }
    setProdutosSel((prev) => {
      const existente = prev.find((x) => x.produto.id === p.id);
      if (existente) {
        if (existente.quantidade >= p.estoque) {
          toast.error(`Estoque máximo de "${p.nome}" atingido`);
          return prev;
        }
        return prev.map((x) =>
          x.produto.id === p.id ? { ...x, quantidade: x.quantidade + 1 } : x
        );
      }
      return [
        ...prev,
        {
          produto: p,
          quantidade: 1,
          precoComDesconto: precoComDescontoDeNivel(p, clienteNivelNumero),
        },
      ];
    });
    setBuscaProduto("");
  }

  function removerProduto(produtoId: string) {
    setProdutosSel((prev) => prev.filter((x) => x.produto.id !== produtoId));
  }

  function alterarQtd(produtoId: string, delta: number) {
    setProdutosSel((prev) =>
      prev
        .map((x) => {
          if (x.produto.id !== produtoId) return x;
          const nova = x.quantidade + delta;
          if (nova <= 0) return null;
          if (nova > x.produto.estoque) {
            toast.error(`Estoque máximo: ${x.produto.estoque}`);
            return x;
          }
          return { ...x, quantidade: nova };
        })
        .filter((x): x is ProdutoSelecionado => x !== null)
    );
  }

  function confirmar() {
    startTransition(async () => {
      try {
        const r = await fecharConta({
          atendimentoId,
          usarCashback,
          formaPagamento: forma,
          descontoExtra: descontoExtraNum.toFixed(2),
          produtos: produtosSel.map((p) => ({
            produtoId: p.produto.id,
            quantidade: p.quantidade,
          })),
        });
        toast.success(`Conta fechada: ${formatBRL(r.valorFinal)}`);
        onOpenChange(false);
        setProdutosSel([]);
        setUsarCashback(false);
        setDescontoExtra("0");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao fechar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fechar conta</DialogTitle>
          <DialogDescription>
            {clienteNome ?? "Cliente avulso"}
            {clienteNivelNumero != null && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                Nível {clienteNivelNumero}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted)]">Valor do serviço</span>
              <span className="font-medium">{formatBRL(valorBase)}</span>
            </div>
            {valorProdutos > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted)]">Produtos</span>
                <span className="font-medium">{formatBRL(valorProdutos)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <Label
                htmlFor="descontoExtra"
                className="text-sm text-[var(--color-muted)]"
              >
                Desconto extra
              </Label>
              <Input
                id="descontoExtra"
                type="number"
                min="0"
                step="0.01"
                value={descontoExtra}
                onChange={(e) => setDescontoExtra(e.target.value)}
                className="w-28 text-right"
              />
            </div>
          </div>

          {produtosDisponiveis.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-[var(--color-muted)]" />
                <Label>Produtos</Label>
              </div>
              {produtosSel.length > 0 && (
                <div className="space-y-1">
                  {produtosSel.map((p) => {
                    const temDesconto =
                      p.precoComDesconto < p.produto.preco;
                    return (
                      <div
                        key={p.produto.id}
                        className="flex items-center gap-2 p-2 rounded-md border border-[var(--color-border)]"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {p.produto.nome}
                          </p>
                          <p className="text-xs text-[var(--color-muted)]">
                            {formatBRL(p.precoComDesconto)}
                            {temDesconto && (
                              <span className="line-through ml-1 text-[var(--color-muted)]/60">
                                {formatBRL(p.produto.preco)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="size-7"
                            onClick={() => alterarQtd(p.produto.id, -1)}
                          >
                            -
                          </Button>
                          <span className="w-6 text-center text-sm">
                            {p.quantidade}
                          </span>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="size-7"
                            onClick={() => alterarQtd(p.produto.id, 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => removerProduto(p.produto.id)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              <Input
                placeholder="Buscar produto..."
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
              />
              {buscaProduto && produtosFiltrados.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-[var(--color-border)] rounded-md">
                  {produtosFiltrados.map((p) => {
                    const precoFinal = precoComDescontoDeNivel(
                      p,
                      clienteNivelNumero
                    );
                    const temDesc = precoFinal < p.preco;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => adicionarProduto(p)}
                        disabled={p.estoque <= 0}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--color-surface-hover)] transition-colors text-sm",
                          p.estoque <= 0 && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{p.nome}</p>
                          <p className="text-xs text-[var(--color-muted)]">
                            Estoque: {p.estoque}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-[var(--color-primary)]">
                            {formatBRL(precoFinal)}
                          </p>
                          {temDesc && (
                            <p className="text-xs text-[var(--color-muted)] line-through">
                              {formatBRL(p.preco)}
                            </p>
                          )}
                        </div>
                        <Plus className="size-4 ml-2 text-[var(--color-muted)]" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {cashbackFpts > 0 && (
            <button
              onClick={() => setUsarCashback((v) => !v)}
              className={cn(
                "w-full p-3 rounded-md border flex items-start justify-between gap-3 text-left transition-colors",
                usarCashback
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                  : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
              )}
            >
              <div className="flex items-start gap-2 min-w-0">
                <Coins className="size-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    Usar cashback ({cashbackFpts} FPTS)
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Saldo: {formatBRL(saldoEmReais)} · limite{" "}
                    {cashbackRegra.max_pct}% por serviço
                  </p>
                  {usarCashback && preview.reais > 0 && (
                    <p className="text-xs text-[var(--color-primary)] mt-1">
                      Abate {formatBRL(preview.reais)} (−{preview.fpts} FPTS)
                    </p>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  "size-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                  usarCashback
                    ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                    : "border-[var(--color-border)]"
                )}
              >
                {usarCashback && (
                  <Check className="size-3 text-[var(--color-primary-foreground)]" />
                )}
              </div>
            </button>
          )}

          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <div className="grid grid-cols-5 gap-1">
              {FORMAS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setForma(f.value)}
                  className={cn(
                    "p-2 text-xs rounded-md border transition-colors",
                    forma === f.value
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-md bg-[var(--color-background)]/50 border border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-muted)]">Total</span>
              <span className="text-2xl font-semibold text-[var(--color-primary)]">
                {formatBRL(valorFinal)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmar} disabled={pending}>
              {pending ? "Processando..." : "Confirmar pagamento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
