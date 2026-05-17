import { requireSession } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { EquipeRepo } from "@/infrastructure/database/repositories/equipe.repo";
import { BloqueiosClient } from "./bloqueios-client";

export default async function BloqueiosPage() {
  const session = await requireSession();
  const barbeariasRepo = new BarbeariasRepo(session.barbeariaId);
  const equipeRepo = new EquipeRepo(session.barbeariaId);
  const [barbearia, equipeAll] = await Promise.all([
    barbeariasRepo.get(),
    equipeRepo.list({ ativosOnly: true }),
  ]);

  // Barbeiro só enxerga e cria bloqueios da própria agenda.
  const barbeiroLogado = session.cargo === "barbeiro";
  const equipeVisivel = barbeiroLogado
    ? equipeAll.filter((e) => e.id === session.equipeId)
    : equipeAll;
  const bloqueiosVisiveis = (barbearia?.config.bloqueios ?? []).filter(
    (b) => !barbeiroLogado || b.barbeiro_id === session.equipeId
  );

  return (
    <BloqueiosClient
      bloqueios={bloqueiosVisiveis}
      equipe={equipeVisivel}
      sessionEquipeId={session.equipeId}
      barbeiroLogado={barbeiroLogado}
    />
  );
}
