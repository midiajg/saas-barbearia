import { notFound } from "next/navigation";
import { requireClienteSession } from "@/lib/auth/session";
import { buscarBarbeariaPorSlug } from "@/infrastructure/database/repositories/barbearias.repo";
import { EquipeRepo } from "@/infrastructure/database/repositories/equipe.repo";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import { AgendarClient } from "./agendar-client";

export default async function AgendarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const barbearia = await buscarBarbeariaPorSlug(slug);
  if (!barbearia) notFound();

  await requireClienteSession(slug);

  const equipeRepo = new EquipeRepo(barbearia.id);
  const atRepo = new AtendimentosRepo(barbearia.id);

  const agora = new Date();
  const em14dias = new Date();
  em14dias.setDate(em14dias.getDate() + 14);

  const [equipe, atendimentos] = await Promise.all([
    equipeRepo.list({ ativosOnly: true }),
    atRepo.listPorPeriodo(agora, em14dias),
  ]);

  // Filtra só quem atende (barbeiro e dono/gerente que tambem atendam)
  const barbeiros = equipe.filter(
    (e) => e.cargo === "barbeiro" || e.cargo === "dono" || e.cargo === "gerente"
  );

  const servicos = (barbearia.config.catalogo_servicos ?? []).filter(
    (s) => s.ativo
  );

  return (
    <AgendarClient
      slug={slug}
      equipe={barbeiros}
      servicos={servicos}
      horarios={barbearia.config.horarios ?? []}
      atendimentosProximos={atendimentos}
    />
  );
}
