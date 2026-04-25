"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  Plus,
} from "lucide-react";
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
import { formatBRL } from "@/lib/utils";
import { abrirCaixa, lancarMovimento, fecharCaixa } from "./actions";
import type {
  Atendimento,
  CaixaAberto,
  CaixaFechado,
} from "@/infrastructure/database/types";

export function CaixaClient({
  caixa,
  historico,
  atendimentosHoje,
}: {
  caixa: CaixaAberto | null;
  historico: CaixaFechado[];
  atendimentosHoje: Atendimento[];
}) {
  const [pending, startTransition] = useTransition();
  const [openAbrir, setOpenAbrir] = useState(false);
  const [openMov, setOpenMov] = useState<
    "sangria" | "suprimento" | "ajuste" | null
  >(null);
  const [openFechar, setOpenFechar] = useState(false);

  const recebidoSistema = useMemo(() => {
    if (!caixa) return 0;
    const ini = new Date(caixa.aberto_em).getTime();
    return atendimentosHoje
      .filter(
        (a) =>
          a.status === "realizado" &&
          a.forma_pagamento === "dinheiro" &&
          new Date(a.inicio).getTime() >= ini
      )
      .reduce((s, a) => s + Number.parseFloat(a.valor_pago ?? "0"), 0);
  }, [caixa, atendimentosHoje]);

  const totais = useMemo(() => {
    const supr = (caixa?.movimentos ?? [])
      .filter((m) => m.tipo === "suprimento")
      .reduce((s, m) => s + m.valor, 0);
    const sang = (caixa?.movimentos ?? [])
      .filter((m) => m.tipo === "sangria")
      .reduce((s, m) => s + m.valor, 0);
    const aju = (caixa?.movimentos ?? [])
      .filter((m) => m.tipo === "ajuste")
      .reduce((s, m) => s + m.valor, 0);
    const esperado =
      (caixa?.saldo_inicial ?? 0) + recebidoSistema + supr - sang + aju;
    return { supr, sang, aju, esperado };
  }, [caixa, recebidoSistema]);

  function abrir(formData: FormData) {
    const valor = Number.parseFloat(String(formData.get("valor") || "0"));
    if (valor < 0) {
      toast.error("Valor inválido");
      return;
    }
    startTransition(async () => {
      try {
        await abrirCaixa(valor);
        toast.success("Caixa aberto");
        setOpenAbrir(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function lancar(formData: FormData) {
    if (!openMov) return;
    const valor = Number.parseFloat(String(formData.get("valor") || "0"));
    const motivo = String(formData.get("motivo") || "");
    if (valor <= 0) {
      toast.error("Valor deve ser positivo");
      return;
    }
    startTransition(async () => {
      try {
        await lancarMovimento({ tipo: openMov, valor, motivo });
        toast.success("Movimento lançado");
        setOpenMov(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function fechar(formData: FormData) {
    const contado = Number.parseFloat(
      String(formData.get("contado") || "0")
    );
    if (contado < 0) {
      toast.error("Valor inválido");
      return;
    }
    startTransition(async () => {
      try {
        await fecharCaixa(contado);
        toast.success("Caixa fechado");
        setOpenFechar(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display">Caixa</h1>
        <p className="text-[var(--color-muted)]">
          Abertura, movimentos do dia e fechamento com conferência
        </p>
      </div>

      {!caixa ? (
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <Lock className="size-10 mx-auto text-[var(--color-muted)]" />
            <p className="text-lg font-display">Caixa fechado</p>
            <p className="text-sm text-[var(--color-muted)]">
              Abra o caixa pra começar a operar
            </p>
            <Button onClick={() => setOpenAbrir(true)}>
              <Unlock className="size-4" /> Abrir caixa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi
              label="Saldo inicial"
              valor={caixa.saldo_inicial}
              cor="text-[var(--color-muted)]"
            />
            <Kpi
              label="Recebido no caixa"
              valor={recebidoSistema}
              cor="text-[var(--color-success)]"
            />
            <Kpi
              label="Sangria"
              valor={-totais.sang}
              cor="text-[var(--color-warning)]"
            />
            <Kpi
              label="Esperado"
              valor={totais.esperado}
              cor="text-[var(--color-primary)]"
              destaque
            />
          </div>

          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
                    Aberto em
                  </p>
                  <p className="font-medium">
                    {new Date(caixa.aberto_em).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOpenMov("suprimento")}
                  >
                    <TrendingUp className="size-3.5" /> Suprimento
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOpenMov("sangria")}
                  >
                    <TrendingDown className="size-3.5" /> Sangria
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setOpenFechar(true)}
                    className="bg-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/90"
                  >
                    <Lock className="size-3.5" /> Fechar caixa
                  </Button>
                </div>
              </div>

              {caixa.movimentos.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)] text-center py-4">
                  Nenhum movimento ainda
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {caixa.movimentos
                    .slice()
                    .reverse()
                    .map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between text-sm p-2 rounded border border-[var(--color-border)]"
                      >
                        <div>
                          <span className="font-medium capitalize">
                            {m.tipo}
                          </span>
                          {m.motivo && (
                            <span className="text-[var(--color-muted)] ml-2">
                              {m.motivo}
                            </span>
                          )}
                          <span className="text-xs text-[var(--color-muted)] ml-2">
                            {new Date(m.hora).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <span
                          className={`font-medium ${
                            m.tipo === "sangria"
                              ? "text-[var(--color-warning)]"
                              : "text-[var(--color-success)]"
                          }`}
                        >
                          {m.tipo === "sangria" ? "-" : "+"}
                          {formatBRL(m.valor)}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {historico.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="p-5 border-b border-[var(--color-border)]">
              <h2 className="font-display">Histórico (últimos {historico.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--color-muted)] uppercase border-b border-[var(--color-border)]">
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3 text-right">Sistema</th>
                  <th className="px-5 py-3 text-right">Contado</th>
                  <th className="px-5 py-3 text-right">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {historico
                  .slice()
                  .reverse()
                  .map((h) => (
                    <tr
                      key={h.id}
                      className="border-b border-[var(--color-border)] last:border-0"
                    >
                      <td className="px-5 py-3">
                        {new Date(h.data + "T00:00:00").toLocaleDateString(
                          "pt-BR"
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {formatBRL(h.recebido_sistema)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {formatBRL(h.contado_fisico)}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-medium ${
                          h.diferenca === 0
                            ? "text-[var(--color-success)]"
                            : h.diferenca < 0
                              ? "text-[var(--color-destructive)]"
                              : "text-[var(--color-warning)]"
                        }`}
                      >
                        {h.diferenca > 0 && "+"}
                        {formatBRL(h.diferenca)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={openAbrir} onOpenChange={setOpenAbrir}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir caixa</DialogTitle>
          </DialogHeader>
          <form action={abrir} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Saldo inicial em dinheiro (R$)</Label>
              <Input
                id="valor"
                name="valor"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                required
              />
              <p className="text-xs text-[var(--color-muted)]">
                Quanto tem em dinheiro físico no caixa agora
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenAbrir(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                Abrir
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openMov !== null} onOpenChange={() => setOpenMov(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{openMov}</DialogTitle>
          </DialogHeader>
          <form action={lancar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                name="valor"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Input
                id="motivo"
                name="motivo"
                placeholder={
                  openMov === "sangria"
                    ? "Ex: dono retirou pra mercado"
                    : openMov === "suprimento"
                      ? "Ex: troco trazido do banco"
                      : "Ex: correção"
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenMov(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                Lançar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openFechar} onOpenChange={setOpenFechar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar caixa</DialogTitle>
          </DialogHeader>
          <form action={fechar} className="space-y-4">
            <div className="p-3 rounded-md bg-[var(--color-primary)]/10 text-sm">
              <p className="text-[var(--color-muted)]">Esperado pelo sistema:</p>
              <p className="text-2xl font-display text-[var(--color-primary)]">
                {formatBRL(totais.esperado)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contado">
                Quanto tem em dinheiro físico agora? (R$)
              </Label>
              <Input
                id="contado"
                name="contado"
                type="number"
                min="0"
                step="0.01"
                required
                autoFocus
              />
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              Diferença será calculada e registrada no histórico.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenFechar(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                Fechar caixa
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({
  label,
  valor,
  cor,
  destaque,
}: {
  label: string;
  valor: number;
  cor: string;
  destaque?: boolean;
}) {
  return (
    <Card className={destaque ? "border-[var(--color-primary)]" : ""}>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
          {label}
        </p>
        <p className={`text-xl font-display mt-1 ${cor}`}>{formatBRL(valor)}</p>
      </CardContent>
    </Card>
  );
}
