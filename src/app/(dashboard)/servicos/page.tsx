import { requireStaffSession } from "@/lib/auth/session";
import { ServicosRepo } from "@/infrastructure/database/repositories/servicos.repo";
import { ServicosClient } from "./servicos-client";

export default async function ServicosPage() {
  const session = await requireStaffSession();
  const repo = new ServicosRepo(session.orgId);
  const servicos = await repo.list();

  return <ServicosClient servicos={servicos} />;
}
