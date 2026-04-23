import { notFound } from "next/navigation";
import { Star, Coins, Calendar, TrendingUp } from "lucide-react";
import { requireClienteSession } from "@/lib/auth/session";
import { buscarOrganizationPorSlug } from "@/infrastructure/database/repositories/organization.repo";
import {
  getClienteDoPortal,
  listarAgendamentosDoCliente,
  listarFptsEventosDoCliente,
  listarNiveisDaOrg,
  listarBarbeirosDaOrg,
} from "@/infrastructure/database/repositories/cliente-portal.repo";
import { nivelAtual, proximoNivel } from "@/domain/fpts";
import { fptsParaReais } from "@/domain/cashback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, diasDesde } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em atendimento",
  realizado: "Concluído",
  no_show: "Não compareceu",
  cancelado: "Cancelado",
};

const STATUS_STYLE: Record<string, string> = {
  agendado: "bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
  confirmado: "bg-[var(--color-primary)]/25 text-[var(--color-primary)]",
  em_atendimento: "bg-[var(--color-warning)]/20 text-[var(--color-warning)]",
  realizado: "bg-[var(--color-success)]/20 text-[var(--color-success)]",
  no_show: "bg-[var(--color-destructive)]/20 text-[var(--color-destructive)]",
  cancelado: "bg-[var(--color-muted)]/20 text-[var(--color-muted)]",
};

const TIPO_LABEL: Record<string, string> = {
  google: "Avaliação no Google",
  indicacao: "Indicação",
  instagram: "Instagram",
  pontualidade: "Visita",
  aniversario: "Aniversário",
  resgate: "Cashback resgatado",
  ajuste_manual: "Ajuste manual",
};

export default async function MinhaContaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireClienteSession(slug);
  const org = await buscarOrganizationPorSlug(slug);
  if (!org) notFound();

  const [cliente, niveis, agendamentos, eventos, barbeiros] = await Promise.all([
    getClienteDoPortal(session.clienteId),
    listarNiveisDaOrg(org.id),
    listarAgendamentosDoCliente(session.clienteId, 15),
    listarFptsEventosDoCliente(session.clienteId, 20),
    listarBarbeirosDaOrg(org.id),
  ]);

  if (!cliente) notFound();

  const nivel = nivelAtual(cliente.fpts, niveis);
  const proximo = proximoNivel(cliente.fpts, niveis);
  const saldoReais = fptsParaReais(cliente.cashback_fpts, {
    fptsPorReal: org.cashback_fpts_por_real,
    maxPctPorServico: org.cashback_max_pct_por_servico,
  });
  const barbeirosMap = new Map(barbeiros.map((b) => [b.id, b.nome]));

  const realizados = agendamentos.filter((a) => a.status === "realizado");
  const ultimaVisita = cliente.ultima_visita
    ? new Date(cliente.ultima_visita)
    : realizados[0]
      ? new Date(realizados[0].inicio)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display">Olá, {cliente.nome.split(" ")[0]}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {ultimaVisita
            ? `Sua última visita foi há ${diasDesde(ultimaVisita)} dias`
            : "Bem-vindo! Ainda não temos registro de visitas."}
        </p>
      </div>

      {/* Hero cashback */}
      <Card className="bg-gradient-to-br from-[var(--color-primary)]/15 via-[var(--color-primary)]/5 to-transparent border-[var(--color-primary)]/30">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">
                Seu saldo de cashback
              </p>
              <p className="text-4xl font-semibold text-[var(--color-primary)]">
                {formatBRL(saldoReais)}
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                {cliente.cashback_fpts} FPTS disponíveis · use no próximo corte
              </p>
            </div>
            <Coins className="size-10 text-yellow-400 shrink-0" />
          </div>

          {nivel && (
            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: nivel.numero }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">Nível {nivel.nome}</span>
              </div>
              {proximo && (
                <span className="text-xs text-[var(--color-muted)]">
                  faltam {proximo.faltam} FPTS pra {proximo.nivel.nome}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Como ganhar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como ganhar mais pontos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <GanhoBox valor={org.fpts_regras.google ?? 500} label="Google review" />
          <GanhoBox valor={org.fpts_regras.indicacao ?? 500} label="Indicar amigo" />
          <GanhoBox valor={org.fpts_regras.instagram ?? 300} label="Seguir Instagram" />
          <GanhoBox valor={org.fpts_regras.pontualidade ?? 100} label="Cada visita" />
        </CardContent>
      </Card>

      {/* Benefícios do nível atual */}
      {nivel?.beneficios && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-[var(--color-primary)]" />
              Benefícios {nivel.nome}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {nivel.beneficios.descontoProdutos ? (
              <p>• {nivel.beneficios.descontoProdutos}% de desconto em produtos</p>
            ) : null}
            {nivel.beneficios.bonusIndicacao ? (
              <p>• {nivel.beneficios.bonusIndicacao}% a mais trazendo um amigo</p>
            ) : null}
            {nivel.beneficios.servicosGratis?.map((s, i) => (
              <p key={i}>• {s}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Histórico agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="size-4" />
            Meus agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agendamentos.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              Nenhum agendamento ainda. Entre em contato com a barbearia pra
              marcar o primeiro.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {agendamentos.map((a) => {
                const inicio = new Date(a.inicio);
                return (
                  <li
                    key={a.id}
                    className="py-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
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
                      <p className="text-xs text-[var(--color-muted)]">
                        {barbeirosMap.get(a.barbeiro_id) ?? "Barbeiro"}
                        {a.servicos?.length
                          ? ` · ${a.servicos.map((s) => s.nome).join(", ")}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[a.status] ?? ""}`}
                      >
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                      {a.valor_pago && (
                        <p className="text-xs text-[var(--color-muted)]">
                          {formatBRL(Number(a.valor_pago))}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Extrato FPTS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Extrato de pontos</CardTitle>
        </CardHeader>
        <CardContent>
          {eventos.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              Ainda sem movimentação de pontos.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {eventos.map((e) => (
                <li
                  key={e.id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm">
                      {TIPO_LABEL[e.tipo] ?? e.tipo}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {new Date(e.criado_em).toLocaleDateString("pt-BR")}
                      {e.descricao ? ` · ${e.descricao}` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-medium shrink-0 ${
                      e.pontos >= 0
                        ? "text-[var(--color-success)]"
                        : "text-[var(--color-destructive)]"
                    }`}
                  >
                    {e.pontos >= 0 ? "+" : ""}
                    {e.pontos} FPTS
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GanhoBox({ valor, label }: { valor: number; label: string }) {
  return (
    <div className="p-3 rounded-md border border-[var(--color-border)] text-center">
      <p className="text-lg font-semibold text-[var(--color-primary)]">
        +{valor}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </p>
    </div>
  );
}
