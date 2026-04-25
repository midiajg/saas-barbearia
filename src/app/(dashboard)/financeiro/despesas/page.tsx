import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { DespesasClient } from "./despesas-client";

export default async function DespesasPage() {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  return <DespesasClient despesas={barbearia?.config.despesas ?? []} />;
}
