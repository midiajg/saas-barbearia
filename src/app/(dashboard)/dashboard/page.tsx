import Link from "next/link";
import { Calendar, Users, DollarSign, TrendingUp, UserX } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import { EquipeRepo } from "@/infrastructure/database/repositories/equipe.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, diasDesde } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireSession();
  const atRepo = new AtendimentosRepo(session.barbeariaId);
  const equipeRepo = new EquipeRepo(session.barbeariaId);
  const clientesRepo = new ClientesRepo(session.barbeariaId);

  const hoje = new Date();
  const inicioHoje = new Date(hoje);
  inicioHoje.setHours(0, 0, 0, 0);
  const fimHoje = new Date(hoje);
  fimHoje.setHours(23, 59, 59, 999);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
  const umMesAFrente = new Date(hoje);
  umMesAFrente.setDate(umMesAFrente.getDate() + 30);

  const [atendimentosHoje, atendimentosMes, proximosAll, equipe, clientes] =
    await Promise.all([
      atRepo.listPorPeriodo(inicioHoje, fimHoje),
      atRepo.listPorPeriodo(inicioMes, fimMes),
      atRepo.listPorPeriodo(hoje, umMesAFrente),
      equipeRepo.list({ ativosOnly: true }),
      clientesRepo.list({ limit: 500 }),
    ]);

  const realizadosMes = atendimentosMes.filter((a) => a.status === "realizado");
  const faturamentoMes = realizadosMes.reduce(
    (s, a) => s + Number.parseFloat(a.valor_pago ?? "0"),
    0
  );
  const qtdPagos = realizadosMes.length;
  const ticketMedio = qtdPagos > 0 ? faturamentoMes / qtdPagos : 0;

  const proximos = proximosAll
    .filter((a) => a.status === "agendado" || a.status === "confirmado")
    .slice(0, 6);

  const agendamentosHojeAtivos = atendimentosHoje.filter(
    (a) => a.status !== "cancelado"
  ).length;

  // Clientes ativos = visita nos últimos 60 dias
  const corteAtivos = new Date(hoje);
  corteAtivos.setDate(corteAtivos.getDate() - 60);
  const ativos = clientes.filter(
    (c) => c.ultima_visita && new Date(c.ultima_visita) >= corteAtivos
  ).length;

  // Inativos 30+ dias
  const corteInativos = new Date(hoje);
  corteInativos.setDate(corteInativos.getDate() - 30);
  const inativos = clientes
    .filter(
      (c) => c.ultima_visita && new Date(c.ultima_visita) < corteInativos
    )
    .sort(
      (a, b) =>
        new Date(a.ultima_visita!).getTime() -
        new Date(b.ultima_visita!).getTime()
    )
    .slice(0, 6);

  const equipeMap = new Map(equipe.map((e) => [e.id, e.nome]));
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
          value={agendamentosHojeAtivos.toString()}
        />
        <KpiCard
          icon={Users}
          label="Clientes ativos (60d)"
          value={ativos.toString()}
        />
        <KpiCard
          icon={DollarSign}
          label="Faturamento do mês"
          value={formatBRL(faturamentoMes)}
        />
        <KpiCard
          icon={TrendingUp}
          label={`Ticket médio (${qtdPagos})`}
          value={formatBRL(ticketMedio)}
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
                          {equipeMap.get(a.barbeiro_id) ?? "—"}
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
                Nenhum cliente inativo
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
