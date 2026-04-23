import Link from "next/link";
import { notFound } from "next/navigation";
import { Scissors } from "lucide-react";
import { buscarOrganizationPorSlug } from "@/infrastructure/database/repositories/organization.repo";
import { Button } from "@/components/ui/button";

export default async function PortalHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await buscarOrganizationPorSlug(slug);
  if (!org) notFound();

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          {org.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logo_url}
              alt={org.nome}
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <div className="size-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <Scissors className="size-6 text-[var(--color-primary-foreground)]" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-display">{org.nome}</h1>
            <p className="text-sm text-[var(--color-muted)]">
              Seu espaço de fidelidade
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <p className="text-[var(--color-muted)]">
            Acompanhe seus cortes, acumule pontos e ganhe cashback em cada
            visita.
          </p>

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild size="lg">
              <Link href={`/c/${slug}/login`}>Entrar</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/c/${slug}/signup`}>Criar conta</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
