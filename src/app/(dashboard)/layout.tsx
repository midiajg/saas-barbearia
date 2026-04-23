import { requireStaffSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { LayoutProviders } from "./layout-providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaffSession();

  return (
    <LayoutProviders>
      <div className="min-h-screen flex">
        <Sidebar role={session.role} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar nome={session.nome} email={session.email} />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </LayoutProviders>
  );
}
