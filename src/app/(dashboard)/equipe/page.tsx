import { requireDonoOuGerente } from "@/lib/auth/session";
import { EquipeRepo } from "@/infrastructure/database/repositories/equipe.repo";
import { EquipeClient } from "./equipe-client";

export default async function EquipePage() {
  const session = await requireDonoOuGerente();
  const repo = new EquipeRepo(session.barbeariaId);
  const equipe = await repo.list();
  return <EquipeClient equipe={equipe} />;
}
