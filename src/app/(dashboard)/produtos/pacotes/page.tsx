import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { PacotesClient } from "./pacotes-client";

export default async function PacotesPage() {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  return (
    <PacotesClient
      pacotes={barbearia?.config.pacotes ?? []}
      servicos={barbearia?.config.catalogo_servicos ?? []}
    />
  );
}
