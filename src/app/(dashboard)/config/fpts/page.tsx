import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { salvarRegrasFpts } from "./actions";

export default async function FptsRegrasPage() {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  const regras = barbearia?.config.fpts_regras ?? {
    google: 500,
    indicacao: 500,
    instagram: 300,
    pontualidade: 100,
    aniversario: 200,
  };
  const cashback = barbearia?.config.cashback ?? {
    fpts_por_real: 100,
    max_pct: 30,
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display">FPTS & Cashback</h1>
        <p className="text-[var(--color-muted)]">
          Configure quantos FPTS o cliente ganha em cada ação e como vira desconto
        </p>
      </div>

      <form action={salvarRegrasFpts} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quantos FPTS por ação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LinhaRegra
              label="⭐ Avaliar no Google"
              name="google"
              valor={regras.google}
            />
            <LinhaRegra
              label="🤝 Indicar um amigo"
              name="indicacao"
              valor={regras.indicacao}
            />
            <LinhaRegra
              label="📸 Seguir/engajar Instagram"
              name="instagram"
              valor={regras.instagram}
            />
            <LinhaRegra
              label="⏱️ Comparecer ao agendamento"
              name="pontualidade"
              valor={regras.pontualidade}
            />
            <LinhaRegra
              label="🎂 Aniversário"
              name="aniversario"
              valor={regras.aniversario}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cashback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="fpts_por_real">FPTS por R$ 1,00</Label>
                <p className="text-xs text-[var(--color-muted)]">
                  Quantos pontos equivalem a 1 real de desconto
                </p>
              </div>
              <Input
                id="fpts_por_real"
                name="fpts_por_real"
                type="number"
                min="1"
                step="1"
                defaultValue={cashback.fpts_por_real}
                className="w-32 text-right"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="max_pct">Limite por serviço (%)</Label>
                <p className="text-xs text-[var(--color-muted)]">
                  Cliente só pode abater até X% do valor do serviço
                </p>
              </div>
              <Input
                id="max_pct"
                name="max_pct"
                type="number"
                min="0"
                max="100"
                step="1"
                defaultValue={cashback.max_pct}
                className="w-32 text-right"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Salvar configurações</Button>
        </div>
      </form>
    </div>
  );
}

function LinhaRegra({
  label,
  name,
  valor,
}: {
  label: string;
  name: string;
  valor: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={name} className="flex-1">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type="number"
        min="0"
        step="10"
        defaultValue={valor}
        className="w-32 text-right"
      />
    </div>
  );
}
