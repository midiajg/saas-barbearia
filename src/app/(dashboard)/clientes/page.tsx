import { requireSession } from "@/lib/auth/session";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { ClientesClient } from "./clientes-client";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const clientesRepo = new ClientesRepo(session.barbeariaId);
  const barbeariasRepo = new BarbeariasRepo(session.barbeariaId);

  const [lista, barbearia] = await Promise.all([
    clientesRepo.list({ search: params.q, limit: 200 }),
    barbeariasRepo.get(),
  ]);

  return (
    <ClientesClient
      clientes={lista}
      niveis={barbearia?.config.niveis ?? []}
      fptsRegras={
        barbearia?.config.fpts_regras ?? {
          google: 500,
          indicacao: 500,
          instagram: 300,
          pontualidade: 100,
          aniversario: 200,
        }
      }
      busca={params.q ?? ""}
    />
  );
}
