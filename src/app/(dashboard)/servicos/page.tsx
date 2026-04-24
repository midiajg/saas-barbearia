import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { ServicosClient } from "./servicos-client";

export default async function ServicosPage() {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  const servicos = barbearia?.config.catalogo_servicos ?? [];
  return <ServicosClient servicos={servicos} />;
}
