import Link from "next/link";
import { notFound } from "next/navigation";
import { Scissors, LogOut } from "lucide-react";
import { requireClienteSession } from "@/lib/auth/session";
import { buscarOrganizationPorSlug } from "@/infrastructure/database/repositories/organization.repo";
import { LayoutProviders } from "@/app/(dashboard)/layout-providers";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await buscarOrganizationPorSlug(slug);
  if (!org) notFound();
  const session = await requireClienteSession(slug);

  return (
    <LayoutProviders>
      <div className="min-h-screen">
        <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href={`/c/${slug}/minha-conta`} className="flex items-center gap-2">
              {org.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={org.logo_url}
                  alt={org.nome}
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <div className="size-8 rounded-md bg-[var(--color-primary)] flex items-center justify-center">
                  <Scissors className="size-4 text-[var(--color-primary-foreground)]" />
                </div>
              )}
              <span className="font-display">{org.nome}</span>
            </Link>

            <div className="flex items-center gap-3">
              <span className="text-sm hidden sm:inline">
                {session.nome.split(" ")[0]}
              </span>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="size-9 rounded-md flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)] transition-colors"
                  title="Sair"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto p-4 sm:p-6">{children}</main>
      </div>
    </LayoutProviders>
  );
}
