import Link from "next/link";
import { notFound } from "next/navigation";
import { Scissors, Calendar, User } from "lucide-react";
import { buscarBarbeariaPorSlug } from "@/infrastructure/database/repositories/barbearias.repo";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function PortalClienteHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const barbearia = await buscarBarbeariaPorSlug(slug);
  if (!barbearia) notFound();

  const session = await getSession();
  const logado =
    session?.tipo === "cliente" && session.barbeariaSlug === slug
      ? session
      : null;

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="bg-[var(--color-primary)] text-white py-8 px-6 text-center">
        {barbearia.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={barbearia.logo_url}
            alt={barbearia.nome}
            className="size-20 rounded-full mx-auto object-cover border-4 border-white/30"
          />
        ) : (
          <div className="size-20 rounded-full bg-white/20 mx-auto flex items-center justify-center">
            <Scissors className="size-10 text-white" />
          </div>
        )}
        <h1 className="font-display text-3xl mt-3">{barbearia.nome}</h1>
        {barbearia.telefone && (
          <p className="text-white/80 text-sm mt-1">{barbearia.telefone}</p>
        )}
      </header>

      <div className="max-w-md mx-auto px-6 py-8 space-y-4">
        {logado ? (
          <>
            <Card>
              <CardContent className="p-5 text-center space-y-3">
                <p className="text-sm text-[var(--color-muted)]">
                  Olá, <span className="font-medium">{logado.nome}</span>
                </p>
                <Button asChild className="w-full h-12">
                  <Link href={`/c/${slug}/agendar`}>
                    <Calendar className="size-5" /> Agendar horário
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link href={`/c/${slug}/meus-agendamentos`}>
                    <User className="size-4" /> Meus agendamentos
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <form action={`/api/auth/logout`} method="POST">
              <Button
                type="submit"
                variant="ghost"
                className="w-full text-[var(--color-muted)]"
              >
                Sair
              </Button>
            </form>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-5 space-y-3">
                <h2 className="font-display text-lg text-center">
                  Agende seu horário online
                </h2>
                <p className="text-sm text-[var(--color-muted)] text-center">
                  Cadastre-se ou entre pra marcar o seu próximo corte
                </p>
                <Button asChild className="w-full h-11">
                  <Link href={`/c/${slug}/cadastro`}>Criar conta</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/c/${slug}/login`}>Já tenho conta</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        <p className="text-center text-xs text-[var(--color-muted)] pt-4">
          Sistema de gestão por Barbearia
        </p>
      </div>
    </main>
  );
}
