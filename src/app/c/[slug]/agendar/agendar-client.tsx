"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatBRL } from "@/lib/utils";
import { confirmarAgendamentoCliente } from "./actions";
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

  // ---- Renderização por etapa ----
  function Header({ voltar }: { voltar?: Etapa | null }) {
    return (
      <div className="flex items-center gap-2 mb-4">
        {voltar ? (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEtapa(voltar)}
          >
            <ArrowLeft className="size-4" />
          </Button>
        ) : (
          <Button size="icon" variant="ghost" onClick={() => router.push(`/c/${slug}`)}>
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
          Agendar
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-md mx-auto">
      {etapa === "barbeiro" && (
        <>
          <Header voltar={null} />
          <h1 className="font-display text-2xl mb-4">
            Escolha o barbeiro
          </h1>
          <div className="space-y-2">
            {equipe.map((b) => (
              <Card
                key={b.id}
                className={cn(
                  "cursor-pointer hover:border-[var(--color-primary)] transition",
                  barbeiroId === b.id && "border-[var(--color-primary)]"
                )}
                onClick={() => setBarbeiroId(b.id)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className="size-12 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0"
                    style={{ backgroundColor: b.cor }}
                  >
                    {b.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.foto_url}
                        alt={b.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      b.nome.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{b.nome}</p>
                    <p className="text-xs text-[var(--color-muted)] capitalize">
                      {b.cargo}
                    </p>
                  </div>
                  {barbeiroId === b.id && (
                    <Check className="size-5 text-[var(--color-primary)]" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            className="w-full mt-6 h-12"
            disabled={!barbeiroId}
            onClick={() => setEtapa("servico")}
          >
            Próximo <ChevronRight className="size-4" />
          </Button>
        </>
      )}

      {etapa === "servico" && (
        <>
          <Header voltar="barbeiro" />
          <h1 className="font-display text-2xl mb-4">
            Escolha os serviços
          </h1>
          <div className="space-y-2">
            {servicos.map((s) => (
              <Card
                key={s.id}
                className={cn(
                  "cursor-pointer hover:border-[var(--color-primary)] transition",
                  servicoIds.includes(s.id) && "border-[var(--color-primary)]"
                )}
                onClick={() => toggleServico(s.id)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className={cn(
                      "size-5 rounded border-2 flex items-center justify-center shrink-0",
                      servicoIds.includes(s.id)
                        ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                        : "border-[var(--color-border)]"
                    )}
                  >
                    {servicoIds.includes(s.id) && (
                      <Check className="size-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{s.nome}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {s.duracao_min} min
                    </p>
                  </div>
                  <p className="text-sm font-medium text-[var(--color-primary)]">
                    {formatBRL(s.preco_eventual)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          {servicoIds.length > 0 && (
            <div className="mt-4 p-3 rounded-md bg-[var(--color-primary)]/10 text-sm flex items-center justify-between">
              <span>
                {duracaoTotal} min · {formatBRL(valorPrevisto)}
              </span>
              <span className="text-xs text-[var(--color-muted)]">
                * preço pode variar por frequência
              </span>
            </div>
          )}
          <Button
            className="w-full mt-6 h-12"
            disabled={servicoIds.length === 0}
            onClick={() => setEtapa("data")}
          >
            Próximo <ChevronRight className="size-4" />
          </Button>
        </>
      )}

      {etapa === "data" && (
        <>
          <Header voltar="servico" />
          <h1 className="font-display text-2xl mb-4">Escolha o dia</h1>
          <div className="grid grid-cols-3 gap-2">
            {dias.map((d) => {
              const iso = isoDia(d);
              return (
                <button
                  key={iso}
                  onClick={() => {
                    setData(iso);
                    setEtapa("hora");
                  }}
                  className={cn(
                    "p-3 rounded-md border text-sm transition capitalize",
                    data === iso
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                      : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                  )}
                >
                  {formatarDataBr(d)}
                </button>
              );
            })}
          </div>
        </>
      )}

      {etapa === "hora" && (
        <>
          <Header voltar="data" />
          <h1 className="font-display text-2xl mb-1">Escolha o horário</h1>
          <p className="text-sm text-[var(--color-muted)] mb-4 capitalize">
            {data && formatarDataBr(new Date(data + "T00:00:00"))}
          </p>
          {horariosDoDia.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] p-4 text-center">
              Nenhum horário disponível neste dia. Tente outro.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {horariosDoDia.map((h) => (
                <button
                  key={h}
                  onClick={() => {
                    setHorario(h);
                    setEtapa("confirmar");
                  }}
                  className={cn(
                    "p-3 rounded-md border text-sm transition",
                    horario === h
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                      : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {etapa === "confirmar" && (
        <>
          <Header voltar="hora" />
          <h1 className="font-display text-2xl mb-4">Confirmar</h1>
          <Card>
            <CardContent className="p-5 space-y-3">
              <Linha label="Barbeiro" valor={barbeiroSelecionado?.nome ?? ""} />
              <Linha
                label="Serviços"
                valor={servicos
                  .filter((s) => servicoIds.includes(s.id))
                  .map((s) => s.nome)
                  .join(", ")}
              />
              <Linha
                label="Quando"
                valor={`${data ? formatarDataBr(new Date(data + "T00:00:00")) : ""} às ${horario}`}
              />
              <Linha label="Duração" valor={`${duracaoTotal} min`} />
              <Linha
                label="Valor estimado"
                valor={formatBRL(valorPrevisto)}
              />
            </CardContent>
          </Card>
          <Button
            className="w-full mt-6 h-12"
            onClick={confirmar}
            disabled={pending}
          >
            {pending ? "Agendando..." : "Confirmar agendamento"}
          </Button>
        </>
      )}
    </main>
  );
}

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-[var(--color-muted)]">{label}</span>
      <span className="font-medium text-right capitalize">{valor}</span>
    </div>
  );
}
