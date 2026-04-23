"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { adicionarFeriado, removerFeriado } from "./actions";
import type { Feriado } from "@/infrastructure/database/schema";

export function FeriadosCard({ feriados }: { feriados: Feriado[] }) {
  const [pending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      try {
        await adicionarFeriado(formData);
        toast.success("Feriado adicionado");
        (document.getElementById("feriado-form") as HTMLFormElement)?.reset();
      } catch {
        toast.error("Erro ao adicionar");
      }
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removerFeriado(id);
      toast.success("Feriado removido");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feriados e dias fechados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form id="feriado-form" action={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="data">Data</Label>
            <Input id="data" name="data" type="date" required />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              name="descricao"
              placeholder="Natal, recesso..."
              required
            />
          </div>
          <Button type="submit" disabled={pending} className="self-end">
            Adicionar
          </Button>
        </form>

        {feriados.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Nenhum feriado cadastrado.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {feriados.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="font-medium">{f.descricao}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {new Date(f.data).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemove(f.id)}
                  disabled={pending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
