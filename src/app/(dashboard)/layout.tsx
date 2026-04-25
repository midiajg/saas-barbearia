import { requireSession } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
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
      <div
        className="min-h-screen flex"
        style={{ ["--color-primary" as string]: corPrimaria }}
      >
        <Sidebar cargo={session.cargo} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar nome={session.nome} email={session.email} />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </LayoutProviders>
  );
}
