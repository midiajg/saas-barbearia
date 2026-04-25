"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LinkIndicacao({
  slug,
  clienteId,
  pontos,
}: {
  slug: string;
  clienteId: string;
  pontos: number;
}) {
  const [copiado, setCopiado] = useState(false);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/c/${slug}/cadastro?ref=${clienteId}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      toast.error("Não consegui copiar. Selecione o link manualmente.");
    }
  }

  async function compartilhar() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Indicação",
          text: `Cadastre-se aqui e ganhamos +${pontos} FPTS cada um!`,
          url,
        });
      } catch {
        // user cancelou
      }
    } else {
      copiar();
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--color-muted)] text-center">
        🤝 Indique um amigo e ganhe{" "}
        <span className="font-semibold text-[var(--color-primary)]">
          +{pontos} FPTS
        </span>
      </p>
      <Button
        onClick={compartilhar}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {copiado ? (
          <Check className="size-4" />
        ) : (
          <Share2 className="size-4" />
        )}
        {copiado ? "Copiado!" : "Compartilhar link"}
      </Button>
    </div>
  );
}
