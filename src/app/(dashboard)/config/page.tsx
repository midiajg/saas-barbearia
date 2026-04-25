import { requireDono } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { ConfigForm } from "./config-form";

export default async function ConfigPage() {
  const session = await requireDono();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) return null;
  return <ConfigForm barbearia={barbearia} />;
}
