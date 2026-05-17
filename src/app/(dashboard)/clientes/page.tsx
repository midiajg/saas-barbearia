import { requireSession } from "@/lib/auth/session";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
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

  const [listaCompleta, barbearia] = await Promise.all([
    clientesRepo.list({ search: params.q, limit: 200 }),
    barbeariasRepo.get(),
  ]);

  // Barbeiro vê só clientes que ele já atendeu ou tem agendado.
  let lista = listaCompleta;
  if (session.cargo === "barbeiro") {
    const atRepo = new AtendimentosRepo(session.barbeariaId);
    const idsPermitidos = await atRepo.clienteIdsDoBarbeiro(session.equipeId);
    lista = listaCompleta.filter((c) => idsPermitidos.has(c.id));
  }

  return (
    <ClientesClient
      clientes={lista}
      niveis={barbearia?.config.niveis ?? []}
      pacotes={barbearia?.config.pacotes ?? []}
      servicos={barbearia?.config.catalogo_servicos ?? []}
      fptsRegras={
        barbearia?.config.fpts_regras ?? {
          google: 500,
          indicacao: 500,
          instagram: 300,
          pontualidade: 100,
          aniversario: 200,
        }
      }
      pontuacoesCustom={barbearia?.config.pontuacoes_custom ?? []}
      busca={params.q ?? ""}
    />
  );
}
