"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FotoUpload } from "@/components/foto-upload";
import { atualizarBarbearia } from "./actions";
import type { Barbearia } from "@/infrastructure/database/types";

const CORES_PRESET = [
  { nome: "Tech Teal (padrão)", hex: "#45D4C0" },
  { nome: "Verde Floresta", hex: "#1a8577" },
  { nome: "Azul Royal", hex: "#3b82f6" },
  { nome: "Roxo Premium", hex: "#9333ea" },
  { nome: "Vinho", hex: "#7f1d1d" },
  { nome: "Dourado", hex: "#d4a82a" },
  { nome: "Vermelho Vivo", hex: "#dc2626" },
  { nome: "Preto Elegante", hex: "#171717" },
];

export function ConfigForm({ barbearia }: { barbearia: Barbearia }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [logoUrl, setLogoUrl] = useState<string | null>(barbearia.logo_url);
  const [corPrimaria, setCorPrimaria] = useState<string>(
    barbearia.config.paleta?.primary ?? "#45D4C0"
  );

  function handleSubmit(formData: FormData) {
    formData.set("logoUrl", logoUrl ?? "");
    formData.set("corPrimaria", corPrimaria);
    startTransition(async () => {
      try {
        await atualizarBarbearia(formData);
        toast.success("Configurações salvas");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display">Barbearia</h1>
        <p className="text-[var(--color-muted)]">
          Identidade que aparece pra equipe e pros clientes
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da barbearia</Label>
              <Input
                id="nome"
                name="nome"
                defaultValue={barbearia.nome}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                defaultValue={barbearia.telefone ?? ""}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <FotoUpload value={logoUrl} onChange={setLogoUrl} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cor da marca</CardTitle>
            <p className="text-xs text-[var(--color-muted)]">
              Aparece em botões, destaques, cliente card e portal
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {CORES_PRESET.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setCorPrimaria(c.hex)}
                  className={`p-2 rounded-md border-2 transition ${
                    corPrimaria === c.hex
                      ? "border-[var(--color-primary)]"
                      : "border-transparent"
                  }`}
                  title={c.nome}
                >
                  <div
                    className="size-10 rounded-md mx-auto shadow"
                    style={{ backgroundColor: c.hex }}
                  />
                  <p className="text-[10px] mt-1 text-[var(--color-muted)] truncate">
                    {c.nome}
                  </p>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-[var(--color-border)]">
              <Input
                type="color"
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                placeholder="#45D4C0"
                className="flex-1 font-mono"
              />
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              💡 Atualize a página depois de salvar para ver a nova cor aplicada
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
