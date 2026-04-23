"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Coins, Check } from "lucide-react";
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
import type { FormaPagamento } from "@/infrastructure/database/types";

const FORMAS: { value: FormaPagamento; label: string }[] = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "cartao_debito", label: "Débito" },
  { value: "cartao_credito", label: "Crédito" },
  { value: "fiado", label: "Fiado" },
];

export function FecharContaDialog({
  open,
  onOpenChange,
  agendamentoId,
  clienteNome,
  valorBase,
  cashbackFpts,
  cashbackFptsPorReal,
  cashbackMaxPct,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  agendamentoId: string;
  clienteNome: string | null;
  valorBase: number;
  cashbackFpts: number;
  cashbackFptsPorReal: number;
  cashbackMaxPct: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const [usarCashback, setUsarCashback] = useState(false);
  const [descontoExtra, setDescontoExtra] = useState("0");

  const descontoExtraNum = Number.parseFloat(descontoExtra) || 0;
  const valorComDescontoExtra = Math.max(0, valorBase - descontoExtraNum);

  const preview = useMemo(() => {
    if (!usarCashback || cashbackFpts <= 0) {
      return { reais: 0, fpts: 0 };
    }
    return calcularAbateMaximo(cashbackFpts, valorComDescontoExtra, {
      fptsPorReal: cashbackFptsPorReal,
      maxPctPorServico: cashbackMaxPct,
    });
  }, [
    usarCashback,
    cashbackFpts,
    valorComDescontoExtra,
    cashbackFptsPorReal,
    cashbackMaxPct,
  ]);

  const valorFinal = Math.max(0, valorComDescontoExtra - preview.reais);
  const saldoEmReais = Math.floor((cashbackFpts / cashbackFptsPorReal) * 100) / 100;

  function confirmar() {
    startTransition(async () => {
      try {
        const r = await fecharConta({
          agendamentoId,
          usarCashback,
          formaPagamento: forma,
          descontoExtra: descontoExtraNum.toFixed(2),
        });
        toast.success(`Conta fechada: ${formatBRL(r.valorFinal)}`);
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao fechar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fechar conta</DialogTitle>
          <DialogDescription>
            {clienteNome ?? "Cliente avulso"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted)]">Valor do serviço</span>
              <span className="font-medium">{formatBRL(valorBase)}</span>
            </div>

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
                    {cashbackMaxPct}% por serviço
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
