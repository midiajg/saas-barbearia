import { requireSession } from "@/lib/auth/session";
import { EquipeRepo } from "@/infrastructure/database/repositories/equipe.repo";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { AgendaClient } from "./agenda-client";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const data = params.data ? new Date(params.data + "T00:00:00") : new Date();

  const equipeRepo = new EquipeRepo(session.barbeariaId);
  const atRepo = new AtendimentosRepo(session.barbeariaId);
  const clientesRepo = new ClientesRepo(session.barbeariaId);
  const barbeariasRepo = new BarbeariasRepo(session.barbeariaId);

  const [equipeToda, atendimentosAll, clientes, barbearia] = await Promise.all([
    equipeRepo.list({ ativosOnly: true }),
    atRepo.listDoDia(data),
    clientesRepo.list({ limit: 500 }),
    barbeariasRepo.get(),
  ]);

  // Barbeiro logado só vê a si próprio + seus atendimentos
  let equipe = equipeToda;
  let atendimentos = atendimentosAll;
  if (session.cargo === "barbeiro") {
    equipe = equipeToda.filter((e) => e.id === session.equipeId);
    atendimentos = atendimentosAll.filter(
      (a) => a.barbeiro_id === session.equipeId
    );
  }

  const horarios = barbearia?.config.horarios ?? [];
  const diaSemana = data.getDay();
  const horarioDoDia = horarios.find((h) => h.dia_semana === diaSemana);
  const horaInicio = horarioDoDia?.ativo
    ? Number.parseInt(horarioDoDia.abertura.slice(0, 2))
    : 8;
  const horaFim = horarioDoDia?.ativo
    ? Number.parseInt(horarioDoDia.fechamento.slice(0, 2)) + 1
    : 21;

  const servicos = (barbearia?.config.catalogo_servicos ?? []).filter(
    (s) => s.ativo
  );
  const produtos = (barbearia?.config.catalogo_produtos ?? []).filter(
    (p) => p.ativo
  );

  return (
    <AgendaClient
      data={data.toISOString().slice(0, 10)}
      equipe={equipe}
      atendimentos={atendimentos}
      servicos={servicos}
      clientes={clientes}
      produtos={produtos}
      niveis={barbearia?.config.niveis ?? []}
      horaInicio={horaInicio}
      horaFim={horaFim}
      cashbackRegra={
        barbearia?.config.cashback ?? { fpts_por_real: 100, max_pct: 30 }
      }
      fptsRegras={
        barbearia?.config.fpts_regras ?? {
          google: 500,
          indicacao: 500,
          instagram: 300,
          pontualidade: 100,
          aniversario: 200,
        }
      }
    />
  );
}
