"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import type { FormaPagamento } from "@/infrastructure/database/types";

export type FaturamentoPorDia = { data: string; valor: number };
export type TopCliente = {
  clienteId: string;
  nome: string;
  visitas: number;
  total: number;
};
export type TopBarbeiro = {
  barbeiroId: string;
  nome: string;
  atendimentos: number;
  faturamento: number;
};
export type FormaPagamentoFatia = { forma: FormaPagamento; valor: number };
export type ClienteInativo = { id: string; nome: string; diasSemVisita: number };

const PRESETS = [
  { label: "7 dias", dias: 7 },
  { label: "30 dias", dias: 30 },
  { label: "90 dias", dias: 90 },
] as const;

const CHART_COLOR = "#45D4C0";
const FORMA_CORES: Record<string, string> = {
  dinheiro: "#45D4C0",
  pix: "#5AB7E8",
  cartao_debito: "#F4C26D",
  cartao_credito: "#E07E6A",
  fiado: "#A8A39D",
};
const FORMA_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_debito: "Débito",
  cartao_credito: "Crédito",
  fiado: "Fiado",
};

function isoDia(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function RelatoriosClient({
  deInicial,
  ateInicial,
  ticket,
  qtdAtendimentos,
  totalPeriodo,
  faturamentoPorDia,
  topClientes,
  topBarbeiros,
  formasPagamento,
  clientesInativos,
}: {
  deInicial: string;
  ateInicial: string;
  ticket: number;
  qtdAtendimentos: number;
  totalPeriodo: number;
  faturamentoPorDia: FaturamentoPorDia[];
  topClientes: TopCliente[];
  topBarbeiros: TopBarbeiro[];
  formasPagamento: FormaPagamentoFatia[];
  clientesInativos: ClienteInativo[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [de, setDe] = useState(deInicial);
  const [ate, setAte] = useState(ateInicial);

  function aplicarPreset(dias: number) {
    const agora = new Date();
    const inicio = new Date(agora);
    inicio.setDate(inicio.getDate() - dias);
    const d = isoDia(inicio);
    const a = isoDia(agora);
    setDe(d);
    setAte(a);
    startTransition(() => {
      router.push(`/financeiro/relatorios?de=${d}&ate=${a}`);
    });
  }

  function aplicarCustom() {
    startTransition(() => {
      router.push(`/financeiro/relatorios?de=${de}&ate=${ate}`);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display">Relatórios</h1>
        <p className="text-[var(--color-muted)]">
          Visão do período: faturamento, clientes e formas de pagamento
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
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
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Faturamento no período" valor={formatBRL(totalPeriodo)} />
        <KpiCard label="Atendimentos" valor={String(qtdAtendimentos)} />
        <KpiCard label="Ticket médio" valor={formatBRL(ticket)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm uppercase tracking-wider text-[var(--color-muted)] mb-3">
              Faturamento por dia
            </h3>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={faturamentoPorDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3230" />
                  <XAxis
                    dataKey="data"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(v) => formatBRL(Number(v))}
                    contentStyle={{
                      background: "#101815",
                      border: "1px solid #2a3230",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke={CHART_COLOR}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm uppercase tracking-wider text-[var(--color-muted)] mb-3">
              Top barbeiros
            </h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={topBarbeiros} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3230" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    tick={{ fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip
                    formatter={(v) => formatBRL(Number(v))}
                    contentStyle={{
                      background: "#101815",
                      border: "1px solid #2a3230",
                    }}
                  />
                  <Bar dataKey="faturamento" fill={CHART_COLOR} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm uppercase tracking-wider text-[var(--color-muted)] mb-3">
              Formas de pagamento
            </h3>
            {formasPagamento.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">Sem dados.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={formasPagamento}
                      dataKey="valor"
                      nameKey="forma"
                      outerRadius={80}
                      label={(e: { name?: string }) =>
                        FORMA_LABEL[e.name ?? ""] ?? e.name ?? ""
                      }
                    >
                      {formasPagamento.map((f) => (
                        <Cell
                          key={f.forma}
                          fill={FORMA_CORES[f.forma] ?? "#A8A39D"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatBRL(Number(v))}
                      contentStyle={{
                        background: "#101815",
                        border: "1px solid #2a3230",
                      }}
                    />
                    <Legend
                      formatter={(v) => FORMA_LABEL[v as string] ?? v}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm uppercase tracking-wider text-[var(--color-muted)] mb-3">
              Top clientes
            </h3>
            {topClientes.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">Sem dados.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--color-muted)] uppercase">
                    <th className="pb-2">Cliente</th>
                    <th className="pb-2 text-right">Visitas</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topClientes.map((c) => (
                    <tr
                      key={c.clienteId}
                      className="border-t border-[var(--color-border)]"
                    >
                      <td className="py-2">{c.nome}</td>
                      <td className="py-2 text-right">{c.visitas}</td>
                      <td className="py-2 text-right font-medium">
                        {formatBRL(c.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm uppercase tracking-wider text-[var(--color-muted)] mb-3">
            Clientes inativos (30+ dias)
          </h3>
          {clientesInativos.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              Nenhum cliente inativo.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {clientesInativos.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded border border-[var(--color-border)]"
                >
                  <span className="text-sm">{c.nome}</span>
                  <span className="text-xs text-[var(--color-warning)]">
                    {c.diasSemVisita}d
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, valor }: { label: string; valor: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
          {label}
        </p>
        <p className="text-3xl font-display mt-1">{valor}</p>
      </CardContent>
    </Card>
  );
}
