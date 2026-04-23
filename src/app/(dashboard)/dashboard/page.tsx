import Link from "next/link";
import { Calendar, Users, DollarSign, TrendingUp, UserX } from "lucide-react";
import { requireStaffSession } from "@/lib/auth/session";
import { MetricsRepo } from "@/infrastructure/database/repositories/metrics.repo";
import { BarbeirosRepo } from "@/infrastructure/database/repositories/barbeiros.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, diasDesde } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireStaffSession();
  const metrics = new MetricsRepo(session.orgId);
  const barbeirosRepo = new BarbeirosRepo(session.orgId);
  const clientesRepo = new ClientesRepo(session.orgId);

  const [
    agendamentosHoje,
    { ticket, qtd: pagamentosQtd },
    faturamentoMes,
    clientesAtivos,
    proximos,
    inativos,
    barbeiros,
    clientes,
  ] = await Promise.all([
    metrics.agendamentosHoje(),
    metrics.ticketMedioMes(),
    metrics.faturamentoMes(),
    metrics.clientesAtivos(),
    metrics.proximosAgendamentos(6),
    metrics.clientesInativos(30, 6),
    barbeirosRepo.list({ ativosOnly: true }),
    clientesRepo.list({ limit: 500 }),
  ]);

  const barbeirosMap = new Map(barbeiros.map((b) => [b.id, b.nome]));
  const clientesMap = new Map(clientes.map((c) => [c.id, c.nome]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display">
          Olá, {session.nome.split(" ")[0]}
        </h1>
        <p className="text-[var(--color-muted)]">
          Visão geral da sua barbearia hoje
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Calendar}
          label="Agendamentos hoje"
          value={agendamentosHoje.toString()}
        />
        <KpiCard
          icon={Users}
          label="Clientes ativos (60d)"
          value={clientesAtivos.toString()}
        />
        <KpiCard
          icon={DollarSign}
          label="Faturamento do mês"
          value={formatBRL(faturamentoMes)}
        />
        <KpiCard
          icon={TrendingUp}
          label={`Ticket médio (${pagamentosQtd})`}
          value={formatBRL(ticket)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="size-4 text-[var(--color-primary)]" />
              Próximos agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximos.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">
                Nenhum agendamento futuro.{" "}
                <Link
                  href="/agenda"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  Ir para Agenda
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {proximos.map((a) => {
                  const inicio = new Date(a.inicio);
                  return (
                    <li
                      key={a.id}
                      className="py-2 flex items-center justify-between text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {clientesMap.get(a.cliente_id ?? "") ?? "Cliente"}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          {inicio.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                          {" · "}
                          {inicio.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {barbeirosMap.get(a.barbeiro_id) ?? "—"}
                        </p>
                      </div>
                      {a.valor_total && (
                        <span className="text-xs text-[var(--color-primary)] font-medium">
                          {formatBRL(Number(a.valor_total))}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserX className="size-4 text-[var(--color-warning)]" />
              Clientes inativos 30+ dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inativos.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">
                Nenhum cliente inativo 🎉
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {inativos.map((c) => (
                  <li
                    key={c.id}
                    className="py-2 flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{c.nome}</span>
                    <span className="text-xs text-[var(--color-muted)]">
                      há{" "}
                      {c.ultima_visita
                        ? diasDesde(new Date(c.ultima_visita))
                        : "?"}{" "}
                      dias
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-[var(--color-muted)]">{label}</p>
          <Icon className="size-4 text-[var(--color-primary)]" />
        </div>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
