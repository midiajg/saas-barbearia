"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatBRL } from "@/lib/utils";
import { confirmarAgendamentoCliente } from "./actions";
import { Eyebrow, DoubleRule } from "@/components/editorial";
import type {
  Atendimento,
  CatalogoServico,
  Equipe,
  Horario,
} from "@/infrastructure/database/types";

type Props = {
  slug: string;
  equipe: Equipe[];
  servicos: CatalogoServico[];
  horarios: Horario[];
  atendimentosProximos: Atendimento[];
};

type Etapa = "barbeiro" | "servico" | "data" | "hora" | "confirmar";

function isoDia(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatarDataBr(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

const SLOT_MIN = 30;

export function AgendarClient({
  slug,
  equipe,
  servicos,
  horarios,
  atendimentosProximos,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [etapa, setEtapa] = useState<Etapa>("barbeiro");
  const [barbeiroId, setBarbeiroId] = useState<string | null>(null);
  const [servicoIds, setServicoIds] = useState<string[]>([]);
  const [data, setData] = useState<string | null>(null);
  const [horario, setHorario] = useState<string | null>(null);

  const duracaoTotal = useMemo(
    () =>
      servicos
        .filter((s) => servicoIds.includes(s.id))
        .reduce((a, s) => a + s.duracao_min, 0),
    [servicos, servicoIds]
  );
  const valorPrevisto = useMemo(
    () =>
      servicos
        .filter((s) => servicoIds.includes(s.id))
        .reduce((a, s) => a + s.preco_eventual, 0),
    [servicos, servicoIds]
  );

  const barbeiroSelecionado = equipe.find((e) => e.id === barbeiroId);

  // 14 dias à frente
  const dias = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const arr: Date[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + i);
      const horarioDia = horarios.find(
        (h) => h.dia_semana === d.getDay() && h.ativo
      );
      if (horarioDia) arr.push(d);
    }
    return arr;
  }, [horarios]);

  // Horários disponíveis do dia escolhido
  const horariosDoDia = useMemo(() => {
    if (!data || !barbeiroId) return [];
    const d = new Date(data + "T00:00:00");
    const horarioDia = horarios.find(
      (h) => h.dia_semana === d.getDay() && h.ativo
    );
    if (!horarioDia) return [];

    const [hAb, mAb] = horarioDia.abertura.split(":").map(Number);
    const [hFe, mFe] = horarioDia.fechamento.split(":").map(Number);
    const inicioDia = new Date(d);
    inicioDia.setHours(hAb, mAb, 0, 0);
    const fimDia = new Date(d);
    fimDia.setHours(hFe, mFe, 0, 0);

    const ocupados = atendimentosProximos
      .filter((a) => a.barbeiro_id === barbeiroId && a.status !== "cancelado")
      .map((a) => ({
        inicio: new Date(a.inicio).getTime(),
        fim: new Date(a.fim).getTime(),
      }));

    const slots: string[] = [];
    const agoraMs = Date.now();
    for (
      let t = inicioDia.getTime();
      t + duracaoTotal * 60 * 1000 <= fimDia.getTime();
      t += SLOT_MIN * 60 * 1000
    ) {
      if (t < agoraMs) continue;
      const fimSlot = t + duracaoTotal * 60 * 1000;
      const conflita = ocupados.some(
        (o) => t < o.fim && fimSlot > o.inicio
      );
      if (!conflita) {
        const dt = new Date(t);
        slots.push(
          `${String(dt.getHours()).padStart(2, "0")}:${String(
            dt.getMinutes()
          ).padStart(2, "0")}`
        );
      }
    }
    return slots;
  }, [data, barbeiroId, horarios, atendimentosProximos, duracaoTotal]);

  function toggleServico(id: string) {
    setServicoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function confirmar() {
    if (!barbeiroId || servicoIds.length === 0 || !data || !horario) return;
    startTransition(async () => {
      try {
        await confirmarAgendamentoCliente({
          slug,
          barbeiroId,
          servicoIds,
          data,
          horario,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao agendar");
      }
    });
  }

  const ETAPAS_LABELS = [
    "Profissional",
    "Serviços",
    "Data",
    "Horário",
    "Confirmar",
  ];
  const etapaIdx = ["barbeiro", "servico", "data", "hora", "confirmar"].indexOf(etapa);

  function Letterhead({ voltar }: { voltar?: Etapa | null }) {
    return (
      <div className="px-5 sm:px-10 pt-6 pb-4">
        <div className="max-w-md mx-auto">
          <DoubleRule className="mb-3" />
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <button
              onClick={() =>
                voltar
                  ? setEtapa(voltar)
                  : router.push(`/c/${slug}`)
              }
              className="font-mono tracking-widest text-[var(--color-muted)] uppercase hover:text-[var(--color-foreground)] transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="size-3" /> Voltar
            </button>
            <span className="font-mono tracking-widest text-[var(--color-muted)] uppercase hidden sm:inline">
              Agendamento online
            </span>
            <span className="font-mono tracking-widest text-[var(--color-primary)] uppercase tabular-nums">
              {String(etapaIdx + 1).padStart(2, "0")} / 05
            </span>
          </div>
          <DoubleRule className="mt-3" />
        </div>
      </div>
    );
  }

  function StepIndicator() {
    return (
      <div className="grid grid-cols-5 gap-1 max-w-md mx-auto px-5 sm:px-0 mb-6">
        {ETAPAS_LABELS.map((lbl, i) => (
          <div
            key={lbl}
            className={cn(
              "h-px transition-colors",
              i <= etapaIdx
                ? "bg-[var(--color-primary)]"
                : "bg-[var(--color-hairline)]"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Letterhead
        voltar={
          etapa === "servico"
            ? "barbeiro"
            : etapa === "data"
              ? "servico"
              : etapa === "hora"
                ? "data"
                : etapa === "confirmar"
                  ? "hora"
                  : null
        }
      />

      <StepIndicator />

      <div className="px-4 max-w-md mx-auto w-full flex-1 pb-12">
        {etapa === "barbeiro" && (
          <div className="animate-rise">
            <Eyebrow className="mb-2">Capítulo I · Profissional</Eyebrow>
            <h1 className="display-serif text-3xl sm:text-4xl mb-6 leading-tight">
              Quem vai te <em className="display-italic">atender?</em>
            </h1>
            <ul className="hairline-t hairline-b">
              {equipe.map((b) => (
                <li key={b.id} className="hairline-b last:border-b-0">
                  <button
                    onClick={() => setBarbeiroId(b.id)}
                    className={cn(
                      "w-full px-1 py-4 flex items-center gap-4 transition-all hover:px-3 text-left",
                      barbeiroId === b.id && "px-3 bg-[var(--color-primary)]/5"
                    )}
                  >
                    <div
                      className="size-12 flex items-center justify-center text-white font-display text-lg overflow-hidden shrink-0"
                      style={{ backgroundColor: b.cor }}
                    >
                      {b.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.foto_url} alt={b.nome} className="w-full h-full object-cover" />
                      ) : (
                        b.nome.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{b.nome}</p>
                      <p className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)] mt-0.5">
                        {b.cargo}
                      </p>
                    </div>
                    {barbeiroId === b.id && (
                      <Check className="size-4 text-[var(--color-primary)] shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <Button
              className="w-full mt-8 h-12 rounded-none font-mono tracking-widest text-xs uppercase"
              disabled={!barbeiroId}
              onClick={() => setEtapa("servico")}
            >
              Próximo <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        {etapa === "servico" && (
          <div className="animate-rise">
            <Eyebrow className="mb-2">Capítulo II · Serviços</Eyebrow>
            <h1 className="display-serif text-3xl sm:text-4xl mb-6 leading-tight">
              O que vamos <em className="display-italic">fazer hoje?</em>
            </h1>
            <ul className="hairline-t hairline-b">
              {servicos.map((s) => {
                const sel = servicoIds.includes(s.id);
                return (
                  <li key={s.id} className="hairline-b last:border-b-0">
                    <button
                      onClick={() => toggleServico(s.id)}
                      className={cn(
                        "w-full px-1 py-4 flex items-center gap-4 transition-all hover:px-3 text-left",
                        sel && "px-3 bg-[var(--color-primary)]/5"
                      )}
                    >
                      <div
                        className={cn(
                          "size-5 border flex items-center justify-center shrink-0 transition-colors",
                          sel
                            ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                            : "border-[var(--color-border-strong)]"
                        )}
                      >
                        {sel && <Check className="size-3 text-[var(--color-primary-foreground)]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{s.nome}</p>
                        <p className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)] mt-0.5">
                          {s.duracao_min} min
                        </p>
                      </div>
                      <p className="font-mono text-sm tabular-nums text-[var(--color-primary)] shrink-0">
                        {formatBRL(s.preco_eventual)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
            {servicoIds.length > 0 && (
              <div className="mt-4 px-1 py-3 hairline-t hairline-b flex items-baseline justify-between">
                <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)]">
                  Subtotal
                </span>
                <span className="font-mono tabular-nums text-base">
                  {duracaoTotal}min · {formatBRL(valorPrevisto)}
                </span>
              </div>
            )}
            <p className="text-[10px] font-display italic text-[var(--color-muted)] mt-2 text-center">
              * o preço final pode variar conforme sua frequência
            </p>
            <Button
              className="w-full mt-6 h-12 rounded-none font-mono tracking-widest text-xs uppercase"
              disabled={servicoIds.length === 0}
              onClick={() => setEtapa("data")}
            >
              Próximo <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        {etapa === "data" && (
          <div className="animate-rise">
            <Eyebrow className="mb-2">Capítulo III · Quando</Eyebrow>
            <h1 className="display-serif text-3xl sm:text-4xl mb-6 leading-tight">
              Escolha um <em className="display-italic">dia.</em>
            </h1>
            <div className="grid grid-cols-3 gap-px bg-[var(--color-hairline)] border border-[var(--color-hairline)]">
              {dias.map((d) => {
                const iso = isoDia(d);
                const ehHoje = iso === isoDia(new Date());
                return (
                  <button
                    key={iso}
                    onClick={() => {
                      setData(iso);
                      setEtapa("hora");
                    }}
                    className={cn(
                      "bg-[var(--color-background)] py-4 px-2 transition-colors text-center hover:bg-[var(--color-surface)]",
                      data === iso && "bg-[var(--color-primary)]/10"
                    )}
                  >
                    <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-[var(--color-muted)]">
                      {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                    </p>
                    <p className="display-serif text-xl mt-1">
                      {String(d.getDate()).padStart(2, "0")}
                    </p>
                    <p className="font-mono text-[9px] tracking-widest uppercase text-[var(--color-muted)] mt-0.5">
                      {d.toLocaleDateString("pt-BR", { month: "short" })}
                      {ehHoje && (
                        <span className="text-[var(--color-primary)] ml-1">·</span>
                      )}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {etapa === "hora" && (
          <div className="animate-rise">
            <Eyebrow className="mb-2">
              Capítulo IV · Horário
            </Eyebrow>
            <h1 className="display-serif text-3xl sm:text-4xl leading-tight mb-1">
              Em <em className="display-italic">qual hora?</em>
            </h1>
            <p className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)] mb-6 capitalize">
              {data && formatarDataBr(new Date(data + "T00:00:00"))}
            </p>
            {horariosDoDia.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)] p-6 text-center font-display italic">
                Nenhum horário disponível neste dia. Tente outro.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-px bg-[var(--color-hairline)] border border-[var(--color-hairline)]">
                {horariosDoDia.map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      setHorario(h);
                      setEtapa("confirmar");
                    }}
                    className={cn(
                      "bg-[var(--color-background)] py-4 font-mono tabular-nums text-base transition-colors hover:bg-[var(--color-surface)]",
                      horario === h && "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {etapa === "confirmar" && (
          <div className="animate-rise">
            <Eyebrow className="mb-2">Capítulo V · Confirmar</Eyebrow>
            <h1 className="display-serif text-3xl sm:text-4xl mb-6 leading-tight">
              Tudo <em className="display-italic">certo?</em>
            </h1>
            <div className="hairline-t hairline-b py-4 space-y-3">
              <Linha label="Profissional" valor={barbeiroSelecionado?.nome ?? ""} />
              <Linha
                label="Serviços"
                valor={servicos
                  .filter((s) => servicoIds.includes(s.id))
                  .map((s) => s.nome)
                  .join(", ")}
              />
              <Linha
                label="Quando"
                valor={`${data ? formatarDataBr(new Date(data + "T00:00:00")) : ""} · ${horario}`}
              />
              <Linha label="Duração" valor={`${duracaoTotal} min`} />
              <Linha
                label="Valor estimado"
                valor={formatBRL(valorPrevisto)}
                emphasis
              />
            </div>
            <Button
              className="w-full mt-8 h-12 rounded-none font-mono tracking-widest text-xs uppercase"
              onClick={confirmar}
              disabled={pending}
            >
              {pending ? "Agendando..." : "Confirmar agendamento →"}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

function Linha({
  label,
  valor,
  emphasis,
}: {
  label: string;
  valor: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)] shrink-0">
        {label}
      </span>
      <span
        className="flex-1 border-b border-dotted border-[var(--color-hairline)] translate-y-[-3px]"
        aria-hidden
      />
      <span
        className={cn(
          "shrink-0 text-right text-sm capitalize",
          emphasis
            ? "font-mono tabular-nums text-[var(--color-primary)] text-base"
            : "font-medium"
        )}
      >
        {valor}
      </span>
    </div>
  );
}
