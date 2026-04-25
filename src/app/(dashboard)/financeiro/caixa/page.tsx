import { requireSession } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import { CaixaClient } from "./caixa-client";

export default async function CaixaPage() {
  const session = await requireSession();
  const barbeariasRepo = new BarbeariasRepo(session.barbeariaId);
  const atRepo = new AtendimentosRepo(session.barbeariaId);

  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);
  const fimHoje = new Date();
  fimHoje.setHours(23, 59, 59, 999);

  const [barbearia, atendimentosHoje] = await Promise.all([
    barbeariasRepo.get(),
    atRepo.listPorPeriodo(inicioHoje, fimHoje),
  ]);

  return (
    <CaixaClient
      caixa={barbearia?.config.caixa_atual ?? null}
      historico={barbearia?.config.caixas_historico ?? []}
      atendimentosHoje={atendimentosHoje}
    />
  );
}
