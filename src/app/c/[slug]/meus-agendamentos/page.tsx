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
import { formatBRL } from "@/lib/utils";
import type { Atendimento } from "@/infrastructure/database/types";

const STATUS_LABEL: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em atendimento",
  realizado: "Realizado",
  no_show: "Não compareceu",
  cancelado: "Cancelado",
};

const STATUS_COR: Record<string, string> = {
  agendado: "bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
  confirmado: "bg-[var(--color-primary)]/25 text-[var(--color-primary)]",
  em_atendimento: "bg-[var(--color-warning)]/20 text-[var(--color-warning)]",
  realizado: "bg-[var(--color-success)]/20 text-[var(--color-success)]",
  no_show: "bg-[var(--color-destructive)]/20 text-[var(--color-destructive)]",
  cancelado: "bg-[var(--color-muted)]/20 text-[var(--color-muted)]",
};

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
          <CardContent className="p-4 flex items-center justify-between">
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
              <Agendamento key={a.id} atendimento={a} barbeiroNome={equipeMap.get(a.barbeiro_id) ?? ""} />
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
              <Agendamento key={a.id} atendimento={a} barbeiroNome={equipeMap.get(a.barbeiro_id) ?? ""} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function Agendamento({
  atendimento,
  barbeiroNome,
}: {
  atendimento: Atendimento;
  barbeiroNome: string;
}) {
  const inicio = new Date(atendimento.inicio);
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-sm capitalize">
            {inicio.toLocaleDateString("pt-BR", {
              weekday: "short",
              day: "2-digit",
              month: "short",
            })}
            {" · "}
            {inicio.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-xs text-[var(--color-muted)]">com {barbeiroNome}</p>
          {atendimento.valor_total && (
            <p className="text-xs text-[var(--color-primary)] mt-1">
              {formatBRL(Number.parseFloat(atendimento.valor_total))}
            </p>
          )}
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${
            STATUS_COR[atendimento.status] ?? ""
          }`}
        >
          {STATUS_LABEL[atendimento.status] ?? atendimento.status}
        </span>
      </CardContent>
    </Card>
  );
}
