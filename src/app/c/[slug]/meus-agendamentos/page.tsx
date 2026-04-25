import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Calendar, Package2, Infinity as InfIcon } from "lucide-react";
import { pacoteEstaAtivo } from "@/domain/pacotes";
import { Eyebrow, DoubleRule } from "@/components/editorial";
import { requireClienteSession } from "@/lib/auth/session";
import { buscarBarbeariaPorSlug } from "@/infrastructure/database/repositories/barbearias.repo";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import { EquipeRepo } from "@/infrastructure/database/repositories/equipe.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { supabaseAdmin } from "@/infrastructure/database/client";
import { TABELAS } from "@/infrastructure/database/tabelas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Atendimento } from "@/infrastructure/database/types";
import { AgendamentoItem } from "./agendamento-item";
import { LinkIndicacao } from "./link-indicacao";

export default async function MeusAgendamentosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const barbearia = await buscarBarbeariaPorSlug(slug);
  if (!barbearia) notFound();

  const session = await requireClienteSession(slug);

  const equipeRepo = new EquipeRepo(barbearia.id);
  const clientesRepo = new ClientesRepo(barbearia.id);

  // Busca todos os atendimentos do cliente (ordem desc)
  const { data } = await supabaseAdmin
    .from(TABELAS.atendimentos)
    .select("*")
    .eq("barbearia_id", barbearia.id)
    .eq("cliente_id", session.clienteId)
    .order("inicio", { ascending: false })
    .limit(50);

  const atendimentos = (data ?? []) as Atendimento[];
  const [equipe, cliente] = await Promise.all([
    equipeRepo.list(),
    clientesRepo.get(session.clienteId),
  ]);
  const equipeMap = new Map(equipe.map((e) => [e.id, e.nome]));

  const proximos = atendimentos.filter(
    (a) =>
      (a.status === "agendado" || a.status === "confirmado") &&
      new Date(a.inicio) >= new Date()
  );
  const historico = atendimentos.filter((a) => !proximos.includes(a));

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-10 pt-6 pb-4">
        <div className="max-w-3xl mx-auto">
          <DoubleRule className="mb-3" />
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <Link
              href={`/c/${slug}`}
              className="font-mono tracking-widest text-[var(--color-muted)] uppercase hover:text-[var(--color-foreground)] transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="size-3" /> {barbearia.slug}
            </Link>
            <span className="font-mono tracking-widest text-[var(--color-muted)] uppercase hidden sm:inline">
              Histórico do cliente
            </span>
            <span className="font-mono tracking-widest text-[var(--color-primary)] uppercase">
              Pessoal
            </span>
          </div>
          <DoubleRule className="mt-3" />
        </div>
      </header>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6 w-full flex-1">
      <div className="text-center mb-2">
        <Eyebrow className="justify-center mb-2">Meus agendamentos</Eyebrow>
        <h1 className="display-serif text-3xl">
          {cliente?.nome ? (
            <>
              Olá, <em className="display-italic">{cliente.nome.split(" ")[0]}.</em>
            </>
          ) : (
            "Seu painel"
          )}
        </h1>
      </div>

      {cliente && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-muted)]">Seu saldo</p>
                <p className="text-xl font-display">
                  {cliente.fpts} FPTS
                  {cliente.cashback_fpts > 0 && (
                    <span className="text-xs text-[var(--color-muted)] ml-2">
                      ({cliente.cashback_fpts} em cashback)
                    </span>
                  )}
                </p>
              </div>
              <Button asChild size="sm">
                <Link href={`/c/${slug}/agendar`}>
                  <Plus className="size-4" /> Novo
                </Link>
              </Button>
            </div>

            {pacoteEstaAtivo(cliente.pacote_ativo) && cliente.pacote_ativo && (
              <div className="p-3 rounded-md border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wider text-[var(--color-primary)] font-semibold flex items-center gap-1.5 mb-1">
                      <Package2 className="size-3.5" /> Pacote ativo
                    </p>
                    <p className="font-medium text-sm truncate">
                      {cliente.pacote_ativo.nome}
                    </p>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      Vence em{" "}
                      {new Date(
                        cliente.pacote_ativo.fim
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-1 shrink-0 mt-1">
                    {cliente.pacote_ativo.usos_restantes === null ? (
                      <>
                        <InfIcon className="size-3.5" /> ilimitado
                      </>
                    ) : (
                      `${cliente.pacote_ativo.usos_restantes} uso${cliente.pacote_ativo.usos_restantes === 1 ? "" : "s"}`
                    )}
                  </span>
                </div>
              </div>
            )}

            <LinkIndicacao
              slug={slug}
              clienteId={cliente.id}
              pontos={barbearia.config.fpts_regras.indicacao}
            />
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)] mb-3">
          Próximos
        </h2>
        {proximos.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-center">
              <Calendar className="size-8 mx-auto mb-2 text-[var(--color-muted)]" />
              <p className="text-sm text-[var(--color-muted)]">
                Nenhum agendamento futuro.
              </p>
              <Button asChild className="mt-3">
                <Link href={`/c/${slug}/agendar`}>Agendar agora</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {proximos.map((a) => (
              <AgendamentoItem
                key={a.id}
                atendimento={a}
                barbeiroNome={equipeMap.get(a.barbeiro_id) ?? ""}
                slug={slug}
                podeCancelar={proximos.includes(a)}
              />
            ))}
          </div>
        )}
      </div>

      {historico.length > 0 && (
        <div>
          <h2 className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)] mb-3">
            Histórico
          </h2>
          <div className="space-y-2">
            {historico.map((a) => (
              <AgendamentoItem
                key={a.id}
                atendimento={a}
                barbeiroNome={equipeMap.get(a.barbeiro_id) ?? ""}
                slug={slug}
                podeCancelar={proximos.includes(a)}
              />
            ))}
          </div>
        </div>
      )}
      </div>
    </main>
  );
}

