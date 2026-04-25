import Link from "next/link";
import { Calendar, Users, DollarSign, TrendingUp, UserX, ArrowUpRight } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import { EquipeRepo } from "@/infrastructure/database/repositories/equipe.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { formatBRL, diasDesde } from "@/lib/utils";
import { OnboardingChecklist } from "./onboarding-checklist";
import {
  Eyebrow,
  DoubleRule,
  DisplayNumber,
  EditorialDivider,
} from "@/components/editorial";

export default async function DashboardPage() {
  const session = await requireSession();
  const atRepo = new AtendimentosRepo(session.barbeariaId);
  const equipeRepo = new EquipeRepo(session.barbeariaId);
  const clientesRepo = new ClientesRepo(session.barbeariaId);
  const barbeariasRepo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await barbeariasRepo.get();

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

  const corteAtivos = new Date(hoje);
  corteAtivos.setDate(corteAtivos.getDate() - 60);
  const ativos = clientes.filter(
    (c) => c.ultima_visita && new Date(c.ultima_visita) >= corteAtivos
  ).length;

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

  const onboardingStatus = {
    temServicos:
      (barbearia?.config.catalogo_servicos?.filter((s) => s.ativo).length ?? 0) >
      0,
    temBarbeiros: equipe.length > 1,
    temHorarios:
      (barbearia?.config.horarios?.filter((h) => h.ativo).length ?? 0) > 0,
    temClientes: clientes.length > 0,
  };

  const dataFormatada = hoje.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Cabeçalho editorial */}
      <header>
        <DoubleRule />
        <div className="py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <Eyebrow marker>Painel · Hoje</Eyebrow>
            <h1 className="display-serif text-4xl sm:text-5xl mt-2">
              Olá, <em className="display-italic">{session.nome.split(" ")[0]}.</em>
            </h1>
          </div>
          <p className="font-mono tracking-widest text-xs text-[var(--color-muted)] uppercase">
            {dataFormatada}
          </p>
        </div>
        <DoubleRule />
      </header>

      <OnboardingChecklist status={onboardingStatus} />

      {/* KPIs em grid editorial — sem cards "boxinhos" */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-hairline)]">
          <KpiEditorial
            label="Hoje"
            valor={agendamentosHojeAtivos.toString()}
            sublabel="agendamentos"
            icon={Calendar}
          />
          <KpiEditorial
            label="Ativos · 60d"
            valor={ativos.toString()}
            sublabel="clientes"
            icon={Users}
          />
          <KpiEditorial
            label="Mês corrente"
            valor={formatBRL(faturamentoMes)}
            sublabel="faturamento"
            icon={DollarSign}
            primary
          />
          <KpiEditorial
            label={`Ticket médio · ${qtdPagos}`}
            valor={formatBRL(ticketMedio)}
            sublabel="por atendimento"
            icon={TrendingUp}
          />
        </div>
      </section>

      {/* Listas em duas colunas editoriais */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
        {/* Próximos agendamentos */}
        <div>
          <header className="flex items-baseline justify-between hairline-b pb-2 mb-4">
            <Eyebrow>Em pauta</Eyebrow>
            <Link
              href="/agenda"
              className="text-xs font-mono tracking-widest uppercase text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
            >
              Agenda <ArrowUpRight className="size-3" />
            </Link>
          </header>
          <h2 className="display-serif text-2xl mb-6">Próximos agendamentos</h2>

          {proximos.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] italic font-display">
              Nada na próxima semana.{" "}
              <Link
                href="/agenda"
                className="text-[var(--color-primary)] hover:underline"
              >
                Abrir agenda
              </Link>
            </p>
          ) : (
            <ul>
              {proximos.map((a, i) => {
                const inicio = new Date(a.inicio);
                return (
                  <li
                    key={a.id}
                    className={`flex items-baseline gap-4 py-3 ${i > 0 ? "hairline-t" : ""}`}
                  >
                    <span className="font-mono text-xs tracking-wider text-[var(--color-muted)] w-12 shrink-0">
                      {String(inicio.getDate()).padStart(2, "0")}/
                      {String(inicio.getMonth() + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-xs tracking-wider text-[var(--color-foreground)] w-12 shrink-0">
                      {String(inicio.getHours()).padStart(2, "0")}:
                      {String(inicio.getMinutes()).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {clientesMap.get(a.cliente_id ?? "") ?? "Cliente avulso"}
                      </p>
                      <p className="text-xs text-[var(--color-muted)] truncate">
                        {equipeMap.get(a.barbeiro_id) ?? "—"}
                      </p>
                    </div>
                    {a.valor_total && (
                      <span className="font-mono text-sm text-[var(--color-primary)] tabular-nums shrink-0">
                        {formatBRL(Number(a.valor_total))}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Inativos */}
        <div>
          <header className="flex items-baseline justify-between hairline-b pb-2 mb-4">
            <Eyebrow>Atenção</Eyebrow>
            <Link
              href="/clientes"
              className="text-xs font-mono tracking-widest uppercase text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors flex items-center gap-1"
            >
              Todos <ArrowUpRight className="size-3" />
            </Link>
          </header>
          <h2 className="display-serif text-2xl mb-6">
            Quem precisa de uma <em className="display-italic">ligação</em>
          </h2>

          {inativos.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] italic font-display">
              Nenhum cliente inativo. Belíssimo trabalho.
            </p>
          ) : (
            <ul>
              {inativos.map((c, i) => {
                const dias = c.ultima_visita
                  ? diasDesde(new Date(c.ultima_visita))
                  : 0;
                return (
                  <li
                    key={c.id}
                    className={`flex items-baseline gap-4 py-3 ${i > 0 ? "hairline-t" : ""}`}
                  >
                    <UserX className="size-3.5 text-[var(--color-warning)] shrink-0 self-center" />
                    <span className="flex-1 font-medium truncate">{c.nome}</span>
                    <span className="font-mono text-xs text-[var(--color-muted)] tabular-nums shrink-0">
                      há {dias}d
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <EditorialDivider ornament="·" className="pt-4" />
    </div>
  );
}

function KpiEditorial({
  label,
  valor,
  sublabel,
  icon: Icon,
  primary,
}: {
  label: string;
  valor: string;
  sublabel: string;
  icon: typeof Calendar;
  primary?: boolean;
}) {
  return (
    <div className="bg-[var(--color-background)] p-4 sm:p-6 space-y-3 group hover:bg-[var(--color-surface)]/40 transition-colors">
      <div className="flex items-center justify-between">
        <span className="eyebrow truncate">{label}</span>
        <Icon className="size-3.5 text-[var(--color-muted)] shrink-0" />
      </div>
      <DisplayNumber
        value={valor}
        size="md"
        className={primary ? "text-[var(--color-primary)]" : ""}
      />
      <p className="font-display italic text-xs text-[var(--color-muted)]">
        {sublabel}
      </p>
    </div>
  );
}
