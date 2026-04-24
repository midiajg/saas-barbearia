import { Check, Gem } from "lucide-react";
import { requireDono } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PlanoAssinatura } from "@/infrastructure/database/types";

type PlanoInfo = { nome: string; preco: string; features: string[] };

const PLANOS: Record<PlanoAssinatura, PlanoInfo> = {
  trial: {
    nome: "Trial",
    preco: "Grátis",
    features: ["Até 50 agendamentos/mês", "1 barbeiro", "Suporte por email"],
  },
  basico: {
    nome: "Básico",
    preco: "R$ 97/mês",
    features: [
      "Agendamentos ilimitados",
      "Até 3 barbeiros",
      "Lembretes WhatsApp",
      "Relatórios",
    ],
  },
  pro: {
    nome: "Profissional",
    preco: "R$ 197/mês",
    features: [
      "Tudo do Básico",
      "Barbeiros ilimitados",
      "Produtos e comissões",
      "Suporte prioritário",
    ],
  },
  rede: {
    nome: "Rede",
    preco: "Sob consulta",
    features: [
      "Tudo do Profissional",
      "Multi-unidades",
      "API de integração",
      "Gerente de conta dedicado",
    ],
  },
};

export default async function AssinaturaPage() {
  const session = await requireDono();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();

  const planoAtual: PlanoAssinatura = barbearia?.plano ?? "trial";
  const info = PLANOS[planoAtual];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display">Assinatura</h1>
        <p className="text-[var(--color-muted)]">
          Seu plano atual e opções de upgrade
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                Plano atual
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Gem className="size-6 text-[var(--color-primary)]" />
                <span className="text-3xl font-display">{info.nome}</span>
              </div>
              <p className="text-xl text-[var(--color-primary)] mt-1">
                {info.preco}
              </p>
            </div>
            <Button variant="outline" disabled>
              Mudar plano (em breve)
            </Button>
          </div>

          <div className="pt-5 border-t border-[var(--color-border)]">
            <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-3">
              Incluso
            </p>
            <ul className="space-y-2">
              {info.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-[var(--color-primary)] shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(PLANOS) as PlanoAssinatura[])
          .filter((k) => k !== "trial" && k !== planoAtual)
          .map((key) => {
            const p = PLANOS[key];
            return (
              <Card key={key} className="opacity-75">
                <CardContent className="p-5">
                  <p className="font-display text-xl">{p.nome}</p>
                  <p className="text-[var(--color-primary)] font-medium mt-1">
                    {p.preco}
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-[var(--color-muted)]">
                    {p.features.map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
      </div>

      <p className="text-xs text-[var(--color-muted)] text-center">
        Pagamento e upgrade estarão disponíveis em breve. Hoje, planos são
        alterados manualmente pelo time.
      </p>
    </div>
  );
}
