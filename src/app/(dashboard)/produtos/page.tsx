import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { ProdutosClient } from "./produtos-client";

export default async function ProdutosPage() {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  return (
    <ProdutosClient
      produtos={barbearia?.config.catalogo_produtos ?? []}
      niveis={barbearia?.config.niveis ?? []}
    />
  );
}
