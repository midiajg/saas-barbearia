import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Calendar } from "lucide-react";
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
    <main className="min-h-screen px-4 py-6 max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" asChild>
          <Link href={`/c/${slug}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
          Meus agendamentos
        </p>
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
            <LinkIndicacao
              slug={slug}
              clienteId={cliente.id}
              pontos={barbearia.config.fpts_regras.indicacao}
            />
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-2">
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
          <h2 className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-2">
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
    </main>
  );
}

