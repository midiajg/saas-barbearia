import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { EquipeRepo } from "@/infrastructure/database/repositories/equipe.repo";
import { BloqueiosClient } from "./bloqueios-client";

export default async function BloqueiosPage() {
  const session = await requireDonoOuGerente();
  const barbeariasRepo = new BarbeariasRepo(session.barbeariaId);
  const equipeRepo = new EquipeRepo(session.barbeariaId);
  const [barbearia, equipe] = await Promise.all([
    barbeariasRepo.get(),
    equipeRepo.list({ ativosOnly: true }),
  ]);
  return (
    <BloqueiosClient
      bloqueios={barbearia?.config.bloqueios ?? []}
      equipe={equipe}
    />
  );
}
