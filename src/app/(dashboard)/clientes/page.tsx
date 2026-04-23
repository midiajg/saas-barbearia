import { requireStaffSession } from "@/lib/auth/session";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { supabaseAdmin } from "@/infrastructure/database/client";
import type { Nivel } from "@/infrastructure/database/types";
import { ClientesClient } from "./clientes-client";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireStaffSession();
  const params = await searchParams;
  const repo = new ClientesRepo(session.orgId);

  const [lista, niveisRes] = await Promise.all([
    repo.list({ search: params.q, limit: 100 }),
    supabaseAdmin
      .from("niveis")
      .select("*")
      .eq("org_id", session.orgId)
      .order("numero", { ascending: true }),
  ]);

  return (
    <ClientesClient
      clientes={lista}
      niveis={(niveisRes.data ?? []) as Nivel[]}
      busca={params.q ?? ""}
    />
  );
}
