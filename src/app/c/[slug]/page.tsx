import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, User, ArrowUpRight, Phone, MapPin } from "lucide-react";
import { buscarBarbeariaPorSlug } from "@/infrastructure/database/repositories/barbearias.repo";
import { getSession } from "@/lib/auth/session";
import {
  Eyebrow,
  DoubleRule,
  EditorialDivider,
} from "@/components/editorial";

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
    <main className="min-h-screen flex flex-col">
      {/* Letterhead da barbearia */}
      <header className="px-5 sm:px-10 pt-6 pb-4">
        <div className="max-w-3xl mx-auto">
          <DoubleRule className="mb-3" />
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <span className="font-mono tracking-widest text-[var(--color-muted)] uppercase">
              {barbearia.slug}
            </span>
            <span className="font-mono tracking-widest text-[var(--color-muted)] uppercase hidden sm:inline">
              Agenda online · Clientes
            </span>
            <span className="font-mono tracking-widest text-[var(--color-primary)] uppercase">
              Aberto
            </span>
          </div>
          <DoubleRule className="mt-3" />
        </div>
      </header>

      {/* Identidade da barbearia — hero editorial */}
      <section className="px-5 sm:px-10 pt-10 sm:pt-16 pb-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {barbearia.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={barbearia.logo_url}
              alt={barbearia.nome}
              className="size-20 sm:size-24 rounded-full mx-auto object-cover ring-1 ring-[var(--color-border-strong)] animate-rise"
            />
          ) : (
            <div className="size-20 sm:size-24 rounded-full mx-auto flex items-center justify-center ring-1 ring-[var(--color-border-strong)] bg-[var(--color-surface)] animate-rise">
              <span className="display-serif text-3xl text-[var(--color-primary)]">
                {barbearia.nome.slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}

          <Eyebrow className="justify-center animate-rise" style={{ animationDelay: "100ms" }}>
            Estabelecimento · Atendimento sob marcação
          </Eyebrow>

          <h1
            className="display-serif text-5xl sm:text-7xl md:text-8xl leading-[0.95] animate-rise"
            style={{ animationDelay: "150ms" }}
          >
            {barbearia.nome}
          </h1>

          <div className="animate-rise" style={{ animationDelay: "200ms" }}>
            <EditorialDivider ornament="◆" className="max-w-xs mx-auto" />
          </div>

          {/* Detalhes pequenos estilo etiqueta */}
          <div
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono tracking-widest text-[var(--color-muted)] uppercase animate-rise"
            style={{ animationDelay: "250ms" }}
          >
            {barbearia.telefone && (
              <span className="inline-flex items-center gap-2">
                <Phone className="size-3" /> {barbearia.telefone}
              </span>
            )}
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-3" /> /c/{barbearia.slug}
            </span>
          </div>
        </div>
      </section>

      {/* Bloco de ação principal — tipo "convite" editorial */}
      <section className="px-5 sm:px-10 pb-20 flex-1">
        <div className="max-w-md mx-auto animate-rise" style={{ animationDelay: "350ms" }}>
          {logado ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Eyebrow className="justify-center">Bem-vindo de volta</Eyebrow>
                <p className="display-serif text-2xl">
                  Olá, <em className="display-italic">{logado.nome}.</em>
                </p>
              </div>

              <div className="space-y-0 hairline-t hairline-b">
                <Link
                  href={`/c/${slug}/agendar`}
                  className="group flex items-center justify-between gap-4 px-1 py-5 hairline-b hover:px-3 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                      <Calendar className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium">Agendar horário</p>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5">
                        Próximos 14 dias disponíveis
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 text-[var(--color-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>

                <Link
                  href={`/c/${slug}/meus-agendamentos`}
                  className="group flex items-center justify-between gap-4 px-1 py-5 hover:px-3 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-muted)] ring-1 ring-[var(--color-border)]">
                      <User className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium">Meus agendamentos</p>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5">
                        Histórico, FPTS e pacote ativo
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 text-[var(--color-muted)] group-hover:text-[var(--color-foreground)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
              </div>

              <form action={`/api/auth/logout?tipo=cliente`} method="POST">
                <button
                  type="submit"
                  className="w-full text-center text-xs font-mono tracking-widest uppercase text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors py-2"
                >
                  Sair desta conta
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <p className="display-serif text-3xl leading-tight">
                  Agende seu horário,
                  <br />
                  <em className="display-italic">do seu jeito.</em>
                </p>
                <p className="text-sm text-[var(--color-muted)] max-w-xs mx-auto">
                  Online, sem precisar de aplicativo. Cadastro leva 30 segundos.
                </p>
              </div>

              <div className="space-y-0 hairline-t hairline-b">
                <Link
                  href={`/c/${slug}/cadastro`}
                  className="group flex items-center justify-between gap-4 px-1 py-5 hairline-b hover:px-3 transition-all"
                >
                  <div>
                    <Eyebrow className="mb-1">Primeira vez</Eyebrow>
                    <p className="display-serif text-xl">Criar conta</p>
                  </div>
                  <ArrowUpRight className="size-4 text-[var(--color-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
                <Link
                  href={`/c/${slug}/login`}
                  className="group flex items-center justify-between gap-4 px-1 py-5 hover:px-3 transition-all"
                >
                  <div>
                    <Eyebrow className="mb-1">Já tenho cadastro</Eyebrow>
                    <p className="display-serif text-xl">Entrar</p>
                  </div>
                  <ArrowUpRight className="size-4 text-[var(--color-muted)] group-hover:text-[var(--color-foreground)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="px-5 sm:px-10 py-6 border-t hairline">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono tracking-widest text-[10px] uppercase text-[var(--color-muted)]">
            {barbearia.nome} · Atendimento sob marcação · Estabelecido pelo
            cliente
          </p>
        </div>
      </footer>
    </main>
  );
}
