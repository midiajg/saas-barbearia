"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { salvarNiveis } from "./actions";
import type { Nivel } from "@/infrastructure/database/types";

export function NiveisClient({ niveis }: { niveis: Nivel[] }) {
  const [pending, startTransition] = useTransition();
  const [lista, setLista] = useState<Nivel[]>(
    niveis.length > 0
      ? niveis
      : [
          { numero: 1, nome: "Bronze", min_fpts: 0, beneficios: [] },
          { numero: 2, nome: "Prata", min_fpts: 500, beneficios: [""] },
          { numero: 3, nome: "Ouro", min_fpts: 1500, beneficios: [""] },
        ]
  );

  function update(idx: number, patch: Partial<Nivel>) {
    setLista((prev) => prev.map((n, i) => (i === idx ? { ...n, ...patch } : n)));
  }

  function addNivel() {
    const prox = lista.length + 1;
    setLista((prev) => [
      ...prev,
      {
        numero: prox,
        nome: `Nível ${prox}`,
        min_fpts: prev[prev.length - 1]?.min_fpts + 500 || 0,
        beneficios: [""],
      },
    ]);
  }

  function removeNivel(idx: number) {
    if (lista.length === 1) {
      toast.error("Precisa ter pelo menos 1 nível");
      return;
    }
    setLista((prev) =>
      prev.filter((_, i) => i !== idx).map((n, i) => ({ ...n, numero: i + 1 }))
    );
  }

  function addBeneficio(nivelIdx: number) {
    update(nivelIdx, { beneficios: [...lista[nivelIdx].beneficios, ""] });
  }

  function updateBeneficio(nivelIdx: number, benIdx: number, texto: string) {
    const novos = [...lista[nivelIdx].beneficios];
    novos[benIdx] = texto;
    update(nivelIdx, { beneficios: novos });
  }

  function removeBeneficio(nivelIdx: number, benIdx: number) {
    const novos = lista[nivelIdx].beneficios.filter((_, i) => i !== benIdx);
    update(nivelIdx, { beneficios: novos });
  }

  function salvar() {
    startTransition(async () => {
      try {
        await salvarNiveis(lista);
        toast.success("Níveis salvos");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao salvar");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display">Níveis de Fidelidade</h1>
          <p className="text-[var(--color-muted)]">
            Cliente sobe de nível conforme acumula FPTS
          </p>
        </div>
        <Button onClick={addNivel} variant="outline">
          <Plus className="size-4" /> Novo nível
        </Button>
      </div>

      <div className="space-y-4">
        {lista.map((n, idx) => (
          <Card key={idx}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="size-10 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center font-bold">
                    {n.numero}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nome</Label>
                        <Input
                          value={n.nome}
                          onChange={(e) =>
                            update(idx, { nome: e.target.value })
                          }
                          placeholder="Bronze, Prata, Ouro..."
                        />
                      </div>
                      <div>
                        <Label className="text-xs">FPTS mínimos</Label>
                        <Input
                          type="number"
                          min="0"
                          value={n.min_fpts}
                          onChange={(e) =>
                            update(idx, {
                              min_fpts: Number.parseInt(e.target.value, 10) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeNivel(idx)}
                  className="text-[var(--color-destructive)]"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="pl-13 space-y-2">
                <Label className="text-xs">Benefícios</Label>
                {n.beneficios.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={b}
                      onChange={(e) =>
                        updateBeneficio(idx, i, e.target.value)
                      }
                      placeholder="Ex: 15% em produtos, 1 hidracorte/mês..."
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeBeneficio(idx, i)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addBeneficio(idx)}
                >
                  <Plus className="size-3" /> Adicionar benefício
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={salvar} disabled={pending}>
          {pending ? "Salvando..." : "Salvar todos"}
        </Button>
      </div>
    </div>
  );
}
