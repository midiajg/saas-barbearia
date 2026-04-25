import { requireSession } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LayoutProviders } from "./layout-providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const barbeariaRepo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await barbeariaRepo.get();
  const corPrimaria = barbearia?.config.paleta?.primary ?? "#45D4C0";

  return (
    <LayoutProviders>
      <div style={{ ["--color-primary" as string]: corPrimaria }}>
        <DashboardShell
          cargo={session.cargo}
          nome={session.nome}
          email={session.email}
        >
          {children}
        </DashboardShell>
      </div>
    </LayoutProviders>
  );
}
