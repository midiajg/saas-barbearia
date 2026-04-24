import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { NiveisClient } from "./niveis-client";

export default async function NiveisPage() {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  return <NiveisClient niveis={barbearia?.config.niveis ?? []} />;
}
