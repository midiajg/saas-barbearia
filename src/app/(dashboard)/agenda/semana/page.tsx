import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import { EquipeRepo } from "@/infrastructure/database/repositories/equipe.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/utils";

const DIAS_PT = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

function isoDia(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function SemanaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const refDate = params.data ? new Date(params.data + "T00:00:00") : new Date();

  // segunda da semana de refDate
  const dia = refDate.getDay(); // 0..6
  const diff = dia === 0 ? -6 : 1 - dia; // ajusta pra segunda
  const inicioSemana = new Date(refDate);
  inicioSemana.setDate(refDate.getDate() + diff);
  inicioSemana.setHours(0, 0, 0, 0);
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);
  fimSemana.setHours(23, 59, 59, 999);

  const atRepo = new AtendimentosRepo(session.barbeariaId);
  const equipeRepo = new EquipeRepo(session.barbeariaId);
  const clientesRepo = new ClientesRepo(session.barbeariaId);

  const [atendimentos, equipe, clientes] = await Promise.all([
    atRepo.listPorPeriodo(inicioSemana, fimSemana),
    equipeRepo.list({ ativosOnly: true }),
    clientesRepo.list({ limit: 500 }),
  ]);

  const meusFiltros =
    session.cargo === "barbeiro"
      ? atendimentos.filter((a) => a.barbeiro_id === session.equipeId)
      : atendimentos;

  const equipeMap = new Map(equipe.map((e) => [e.id, e.nome]));
  const clientesMap = new Map(clientes.map((c) => [c.id, c.nome]));

  // Agrupa por dia
  const porDia = new Map<string, typeof meusFiltros>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(inicioSemana);
    d.setDate(inicioSemana.getDate() + i);
    porDia.set(isoDia(d), []);
  }
  for (const a of meusFiltros) {
    if (a.status === "cancelado") continue;
    const dia = isoDia(new Date(a.inicio));
    porDia.get(dia)?.push(a);
  }

  const semanaAnterior = new Date(inicioSemana);
  semanaAnterior.setDate(inicioSemana.getDate() - 7);
  const semanaSeguinte = new Date(inicioSemana);
  semanaSeguinte.setDate(inicioSemana.getDate() + 7);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="outline" asChild>
            <Link href={`/agenda/semana?data=${isoDia(semanaAnterior)}`}>
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <div className="text-center min-w-48">
            <p className="font-display text-lg leading-tight">
              {inicioSemana.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}{" "}
              —{" "}
              {fimSemana.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              Visão semanal
            </p>
          </div>
          <Button size="icon" variant="outline" asChild>
            <Link href={`/agenda/semana?data=${isoDia(semanaSeguinte)}`}>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/agenda">Voltar pra dia</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
        {Array.from(porDia.entries()).map(([diaIso, items]) => {
          const d = new Date(diaIso + "T12:00:00");
          const ehHoje = isoDia(new Date()) === diaIso;
          const diaNome = DIAS_PT[d.getDay()];
          const totalDia = items.reduce(
            (s, a) =>
              s +
              Number.parseFloat(a.valor_pago ?? a.valor_total ?? "0"),
            0
          );
          return (
            <Card
              key={diaIso}
              className={ehHoje ? "border-[var(--color-primary)]" : ""}
            >
              <CardContent className="p-3 space-y-2">
                <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-2">
                  <div>
                    <p className="text-xs text-[var(--color-muted)] uppercase">
                      {diaNome}
                    </p>
                    <p className="font-display text-lg">
                      {d.getDate().toString().padStart(2, "0")}/
                      {(d.getMonth() + 1).toString().padStart(2, "0")}
                    </p>
                  </div>
                  <Link
                    href={`/agenda?data=${diaIso}`}
                    className="text-xs text-[var(--color-primary)] hover:underline"
                  >
                    abrir
                  </Link>
                </div>

                {items.length === 0 ? (
                  <Link
                    href={`/agenda?data=${diaIso}`}
                    className="block text-xs text-center py-4 text-[var(--color-muted)] border border-dashed border-[var(--color-border)] rounded hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  >
                    <Calendar className="size-4 mx-auto mb-1" />
                    Sem agendamentos
                  </Link>
                ) : (
                  <ul className="space-y-1">
                    {items
                      .sort((a, b) => a.inicio.localeCompare(b.inicio))
                      .map((a) => {
                        const inicio = new Date(a.inicio);
                        return (
                          <li
                            key={a.id}
                            className="text-xs p-1.5 rounded bg-[var(--color-primary)]/5 border-l-2 border-[var(--color-primary)]"
                          >
                            <div className="flex items-baseline justify-between">
                              <span className="font-medium">
                                {String(inicio.getHours()).padStart(2, "0")}:
                                {String(inicio.getMinutes()).padStart(2, "0")}
                              </span>
                              <span className="text-[10px] text-[var(--color-muted)] capitalize">
                                {a.status}
                              </span>
                            </div>
                            <p className="truncate">
                              {clientesMap.get(a.cliente_id ?? "") ?? "Cliente"}
                            </p>
                            <p className="text-[10px] text-[var(--color-muted)] truncate">
                              {equipeMap.get(a.barbeiro_id) ?? "—"}
                            </p>
                          </li>
                        );
                      })}
                  </ul>
                )}

                {items.length > 0 && (
                  <div className="pt-2 border-t border-[var(--color-border)] flex items-baseline justify-between text-xs">
                    <span className="text-[var(--color-muted)]">
                      {items.length} atend.
                    </span>
                    <span className="font-medium text-[var(--color-primary)]">
                      {formatBRL(totalDia)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
