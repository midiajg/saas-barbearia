import { requireStaffSession } from "@/lib/auth/session";
import { BarbeirosRepo } from "@/infrastructure/database/repositories/barbeiros.repo";
import { ServicosRepo } from "@/infrastructure/database/repositories/servicos.repo";
import { BarbeirosClient } from "./barbeiros-client";

export default async function BarbeirosPage() {
  const session = await requireStaffSession();
  const barbeirosRepo = new BarbeirosRepo(session.orgId);
  const servicosRepo = new ServicosRepo(session.orgId);

  const [barbeiros, servicos] = await Promise.all([
    barbeirosRepo.list(),
    servicosRepo.list({ ativosOnly: true }),
  ]);

  const barbeirosComServicos = await Promise.all(
    barbeiros.map(async (b) => ({
      ...b,
      servicoIds: (await barbeirosRepo.listServicosDoBarbeiro(b.id)).map(
        (r) => r.servico.id
      ),
    }))
  );

  return <BarbeirosClient barbeiros={barbeirosComServicos} servicos={servicos} />;
}
