"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { exportarCsvComissoes } from "./actions";
import type { ComissaoLinha } from "./actions";

const PRESETS = [
  { label: "Hoje", dias: 0 },
  { label: "7 dias", dias: 7 },
  { label: "30 dias", dias: 30 },
] as const;

function isoDia(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function ComissoesClient({
  linhas,
  deInicial,
  ateInicial,
}: {
  linhas: ComissaoLinha[];
  deInicial: string;
  ateInicial: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [de, setDe] = useState(deInicial);
  const [ate, setAte] = useState(ateInicial);
  const [exporting, setExporting] = useState(false);

  const totalComissoes = linhas.reduce((s, l) => s + l.valorComissao, 0);
  const totalFaturamento = linhas.reduce((s, l) => s + l.faturamentoBruto, 0);
  const totalAtendimentos = linhas.reduce((s, l) => s + l.qtdAtendimentos, 0);

  function aplicarPreset(dias: number) {
    const agora = new Date();
    const inicio = new Date(agora);
    inicio.setDate(inicio.getDate() - dias);
    setDe(isoDia(inicio));
    setAte(isoDia(agora));
    startTransition(() => {
      router.push(
        `/financeiro/comissoes?de=${isoDia(inicio)}&ate=${isoDia(agora)}`
      );
    });
  }

  function aplicarCustom() {
    startTransition(() => {
      router.push(`/financeiro/comissoes?de=${de}&ate=${ate}`);
    });
  }

  async function baixarCsv() {
    setExporting(true);
    try {
      const csv = await exportarCsvComissoes(
        new Date(de + "T00:00:00").toISOString(),
        new Date(ate + "T23:59:59").toISOString()
      );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `comissoes_${de}_${ate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao exportar");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display">Comissões</h1>
        <p className="text-[var(--color-muted)]">
          Quanto cada barbeiro ganhou no período
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex gap-1">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  onClick={() => aplicarPreset(p.dias)}
                  disabled={pending}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="space-y-1">
              <Label htmlFor="de" className="text-xs">
                De
              </Label>
              <Input
                id="de"
                type="date"
                value={de}
                onChange={(e) => setDe(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ate" className="text-xs">
                Até
              </Label>
              <Input
                id="ate"
                type="date"
                value={ate}
                onChange={(e) => setAte(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={aplicarCustom} disabled={pending}>
              Aplicar
            </Button>
            <Button
              variant="outline"
              onClick={baixarCsv}
              disabled={exporting || linhas.length === 0}
            >
              <Download className="size-4" />
              {exporting ? "Exportando..." : "CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
              Atendimentos
            </p>
            <p className="text-3xl font-display mt-1">{totalAtendimentos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
              Faturamento bruto
            </p>
            <p className="text-3xl font-display mt-1">
              {formatBRL(totalFaturamento)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
              Total comissões
            </p>
            <p className="text-3xl font-display mt-1 text-[var(--color-primary)]">
              {formatBRL(totalComissoes)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {linhas.length === 0 ? (
            <p className="p-10 text-center text-[var(--color-muted)]">
              Nenhum barbeiro cadastrado.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  <th className="px-5 py-3 font-medium">Barbeiro</th>
                  <th className="px-5 py-3 font-medium text-right">%</th>
                  <th className="px-5 py-3 font-medium text-right">
                    Atendimentos
                  </th>
                  <th className="px-5 py-3 font-medium text-right">
                    Faturamento
                  </th>
                  <th className="px-5 py-3 font-medium text-right">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr
                    key={l.barbeiroId}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-5 py-3 font-medium">{l.barbeiroNome}</td>
                    <td className="px-5 py-3 text-right">
                      {l.percentualComissao.toFixed(0)}%
                    </td>
                    <td className="px-5 py-3 text-right">
                      {l.qtdAtendimentos}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {formatBRL(l.faturamentoBruto)}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-[var(--color-primary)]">
                      {formatBRL(l.valorComissao)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
