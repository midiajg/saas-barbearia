import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import { EquipeRepo } from "@/infrastructure/database/repositories/equipe.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/utils";
import { Eyebrow, DoubleRule } from "@/components/editorial";

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
      <header className="space-y-3">
        <DoubleRule />
        <div className="py-1 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <Eyebrow marker className="mb-2">
              Agenda · Visão da semana
            </Eyebrow>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                asChild
                className="rounded-none border border-[var(--color-hairline)]"
              >
                <Link href={`/agenda/semana?data=${isoDia(semanaAnterior)}`}>
                  <ChevronLeft className="size-4" />
                </Link>
              </Button>
              <div className="min-w-[200px]">
                <h1 className="display-serif text-2xl sm:text-3xl leading-none">
                  {inicioSemana.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                  })}{" "}
                  <em className="display-italic text-[var(--color-muted)]">a</em>{" "}
                  {fimSemana.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                  })}
                </h1>
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)] mt-1">
                  {inicioSemana.toLocaleDateString("pt-BR", { year: "numeric" })}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                asChild
                className="rounded-none border border-[var(--color-hairline)]"
              >
                <Link href={`/agenda/semana?data=${isoDia(semanaSeguinte)}`}>
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            asChild
            className="rounded-none h-9 font-mono tracking-widest text-[10px] uppercase border border-[var(--color-hairline)] hover:bg-[var(--color-surface)]"
          >
            <Link href="/agenda">← Voltar pra dia</Link>
          </Button>
        </div>
        <DoubleRule />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-px bg-[var(--color-hairline)] border border-[var(--color-hairline)]">
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
            <div
              key={diaIso}
              className={`bg-[var(--color-background)] p-4 space-y-3 min-h-[180px] ${ehHoje ? "ring-1 ring-inset ring-[var(--color-primary)]/40" : ""}`}
            >
              <div className="flex items-baseline justify-between hairline-b pb-2">
                <div>
                  <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-[var(--color-muted)]">
                    {diaNome}
                    {ehHoje && (
                      <span className="ml-1 text-[var(--color-primary)]">·</span>
                    )}
                  </p>
                  <p className="display-serif text-2xl leading-none mt-1">
                    {d.getDate().toString().padStart(2, "0")}
                  </p>
                </div>
                <Link
                  href={`/agenda?data=${diaIso}`}
                  className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
                >
                  Abrir →
                </Link>
              </div>

              {items.length === 0 ? (
                <Link
                  href={`/agenda?data=${diaIso}`}
                  className="block text-xs text-center py-6 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors italic font-display"
                >
                  <Calendar className="size-4 mx-auto mb-1.5 opacity-50" />
                  Sem agendamentos
                </Link>
              ) : (
                <ul className="space-y-2">
                  {items
                    .sort((a, b) => a.inicio.localeCompare(b.inicio))
                    .map((a) => {
                      const inicio = new Date(a.inicio);
                      return (
                        <li
                          key={a.id}
                          className="text-xs hairline-b pb-1.5 last:border-b-0"
                        >
                          <div className="flex items-baseline justify-between">
                            <span className="font-mono tabular-nums text-[var(--color-foreground)]">
                              {String(inicio.getHours()).padStart(2, "0")}:
                              {String(inicio.getMinutes()).padStart(2, "0")}
                            </span>
                            <span className="font-mono text-[9px] tracking-widest uppercase text-[var(--color-muted)]">
                              {a.status}
                            </span>
                          </div>
                          <p className="truncate font-medium mt-0.5">
                            {clientesMap.get(a.cliente_id ?? "") ?? "Cliente"}
                          </p>
                          <p className="text-[10px] text-[var(--color-muted)] truncate italic font-display">
                            {equipeMap.get(a.barbeiro_id) ?? "—"}
                          </p>
                        </li>
                      );
                    })}
                </ul>
              )}

              {items.length > 0 && (
                <div className="pt-2 hairline-t flex items-baseline justify-between">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)]">
                    {items.length} atend.
                  </span>
                  <span className="font-mono tabular-nums text-sm text-[var(--color-primary)]">
                    {formatBRL(totalDia)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
