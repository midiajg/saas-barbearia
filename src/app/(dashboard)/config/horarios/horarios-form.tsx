"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as Switch from "@radix-ui/react-switch";
import { toast } from "sonner";
import { salvarHorario } from "./actions";
import type { Horario } from "@/infrastructure/database/types";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function HorariosForm({ horarios }: { horarios: Horario[] }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState(() =>
    Array.from({ length: 7 }, (_, i) => {
      const h = horarios.find((x) => x.dia_semana === i);
      return {
        diaSemana: i,
        abertura: h?.abertura ?? "09:00",
        fechamento: h?.fechamento ?? "20:00",
        ativo: h?.ativo ?? false,
      };
    })
  );

  function update(idx: number, patch: Partial<(typeof state)[number]>) {
    setState((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  }

  function salvar(idx: number) {
    const row = state[idx];
    startTransition(async () => {
      try {
        await salvarHorario(row);
        toast.success(`${DIAS[idx]} salvo`);
      } catch {
        toast.error("Erro ao salvar");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funcionamento semanal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {state.map((row, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-md border border-[var(--color-border)]"
          >
            <div className="w-24 font-medium">{DIAS[i]}</div>
            <div className="flex items-center gap-2">
              <Switch.Root
                checked={row.ativo}
                onCheckedChange={(v) => update(i, { ativo: v })}
                className="w-9 h-5 rounded-full bg-[var(--color-border)] data-[state=checked]:bg-[var(--color-primary)] relative transition-colors"
              >
                <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[18px]" />
              </Switch.Root>
              <span className="text-xs text-[var(--color-muted)] w-16">
                {row.ativo ? "Aberto" : "Fechado"}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="time"
                value={row.abertura}
                onChange={(e) => update(i, { abertura: e.target.value })}
                disabled={!row.ativo}
                className="w-32"
              />
              <span className="text-[var(--color-muted)]">até</span>
              <Input
                type="time"
                value={row.fechamento}
                onChange={(e) => update(i, { fechamento: e.target.value })}
                disabled={!row.ativo}
                className="w-32"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => salvar(i)}
              disabled={pending}
            >
              Salvar
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
