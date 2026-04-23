import { requireStaffSession } from "@/lib/auth/session";
import { PagamentosRepo } from "@/infrastructure/database/repositories/pagamentos.repo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

const LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_debito: "Débito",
  cartao_credito: "Crédito",
  fiado: "Fiado",
};

export default async function PagamentosPage() {
  const session = await requireStaffSession();
  const repo = new PagamentosRepo(session.orgId);

  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);
  const pagamentos = await repo.listarPorPeriodo(inicio, fim);

  const total = pagamentos.reduce((acc, p) => acc + Number(p.valor), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display">Pagamentos</h1>
        <p className="text-[var(--color-muted)]">
          Recebimentos do mês de{" "}
          {agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[var(--color-muted)]">Total no mês</p>
            <p className="text-2xl font-semibold text-[var(--color-primary)]">
              {formatBRL(total)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[var(--color-muted)]">
              Quantidade de pagamentos
            </p>
            <p className="text-2xl font-semibold">{pagamentos.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[var(--color-muted)]">Ticket médio</p>
            <p className="text-2xl font-semibold">
              {formatBRL(pagamentos.length ? total / pagamentos.length : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          {pagamentos.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              Nenhum pagamento neste mês.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {pagamentos.map((p) => (
                <li
                  key={p.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(p.recebido_em).toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {LABELS[p.forma] ?? p.forma}
                    </p>
                  </div>
                  <p className="font-medium">{formatBRL(Number(p.valor))}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
