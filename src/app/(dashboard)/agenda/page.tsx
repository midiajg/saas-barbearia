import { requireStaffSession } from "@/lib/auth/session";
import { BarbeirosRepo } from "@/infrastructure/database/repositories/barbeiros.repo";
import { AgendamentosRepo } from "@/infrastructure/database/repositories/agendamentos.repo";
import { ServicosRepo } from "@/infrastructure/database/repositories/servicos.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { HorariosRepo } from "@/infrastructure/database/repositories/horarios.repo";
import { OrganizationRepo } from "@/infrastructure/database/repositories/organization.repo";
import { AgendaClient } from "./agenda-client";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const session = await requireStaffSession();
  const params = await searchParams;
  const data = params.data ? new Date(params.data + "T00:00:00") : new Date();

  const barbeirosRepo = new BarbeirosRepo(session.orgId);
  const agendamentosRepo = new AgendamentosRepo(session.orgId);
  const servicosRepo = new ServicosRepo(session.orgId);
  const clientesRepo = new ClientesRepo(session.orgId);
  const horariosRepo = new HorariosRepo(session.orgId);
  const orgRepo = new OrganizationRepo(session.orgId);

  const [barbeirosAll, agendamentosAll, servicos, clientes, horarios, org] =
    await Promise.all([
      barbeirosRepo.list({ ativosOnly: true }),
      agendamentosRepo.listDoDia(data),
      servicosRepo.list({ ativosOnly: true }),
      clientesRepo.list({ limit: 500 }),
      horariosRepo.listSemana(),
      orgRepo.get(),
    ]);

  // Barbeiro logado só vê a própria coluna e os próprios agendamentos
  let barbeiros = barbeirosAll;
  let agendamentos = agendamentosAll;
  if (session.role === "barber") {
    const meu = await barbeirosRepo.getByUserId(session.userId);
    barbeiros = meu ? [meu] : [];
    agendamentos = meu
      ? agendamentosAll.filter((a) => a.barbeiro_id === meu.id)
      : [];
  }

  const horarioDoDia = horarios.find((h) => h.dia_semana === data.getDay());
  const horaInicio = horarioDoDia?.ativo
    ? Number.parseInt(horarioDoDia.abertura.slice(0, 2))
    : 8;
  const horaFim = horarioDoDia?.ativo
    ? Number.parseInt(horarioDoDia.fechamento.slice(0, 2)) + 1
    : 21;

  return (
    <AgendaClient
      data={data.toISOString().slice(0, 10)}
      barbeiros={barbeiros}
      agendamentos={agendamentos}
      servicos={servicos}
      clientes={clientes}
      horaInicio={horaInicio}
      horaFim={horaFim}
      cashbackFptsPorReal={org?.cashback_fpts_por_real ?? 100}
      cashbackMaxPct={org?.cashback_max_pct_por_servico ?? 30}
    />
  );
}
