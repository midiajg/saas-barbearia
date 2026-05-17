"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adicionarPontuacaoCustom, removerPontuacaoCustom } from "./actions";
import type { FptsRegraCustom } from "@/infrastructure/database/types";

export function PontuacoesCustomManager({
  pontuacoes,
}: {
  pontuacoes: FptsRegraCustom[];
}) {
  const [pending, startTransition] = useTransition();
  const [aberto, setAberto] = useState(false);

  function adicionar(formData: FormData) {
    startTransition(async () => {
      try {
        await adicionarPontuacaoCustom(formData);
        toast.success("Pontuação criada");
        setAberto(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function remover(id: string) {
    if (!confirm("Remover esta pontuação?")) return;
    startTransition(async () => {
      try {
        await removerPontuacaoCustom(id);
        toast.success("Removida");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pontuações personalizadas</CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setAberto((v) => !v)}
        >
          <Plus className="size-3.5" />
          {aberto ? "Fechar" : "Adicionar"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {aberto && (
          <form
            action={adicionar}
            className="grid grid-cols-[80px_1fr_120px_auto] gap-2 items-end p-3 border border-[var(--color-border)] rounded-md"
          >
            <div className="space-y-1">
              <Label htmlFor="icone" className="text-xs">
                Ícone
              </Label>
              <Input id="icone" name="icone" placeholder="🎯" required maxLength={4} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="label" className="text-xs">
                Título
              </Label>
              <Input
                id="label"
                name="label"
                placeholder="Ex: Trouxe amigo no mesmo dia"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="valor" className="text-xs">
                FPTS
              </Label>
              <Input
                id="valor"
                name="valor"
                type="number"
                min="0"
                step="10"
                placeholder="100"
                required
              />
            </div>
            <Button type="submit" disabled={pending} size="sm">
              {pending ? "..." : "Salvar"}
            </Button>
          </form>
        )}

        {pontuacoes.length === 0 ? (
          <p className="text-xs text-[var(--color-muted)] italic">
            Crie regras extras pra premiar comportamentos específicos da sua
            barbearia (Ex: trouxe amigo, divulgou no Story, etc).
          </p>
        ) : (
          <ul className="space-y-1.5">
            {pontuacoes.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 p-2 border border-[var(--color-border)] rounded-md text-sm"
              >
                <span className="text-lg">{p.icone}</span>
                <span className="flex-1 font-medium">{p.label}</span>
                <span className="font-mono text-xs text-[var(--color-primary)]">
                  +{p.valor} FPTS
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => remover(p.id)}
                  disabled={pending}
                  className="size-7"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
