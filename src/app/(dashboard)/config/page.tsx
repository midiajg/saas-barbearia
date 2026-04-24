import { requireDono } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { atualizarBarbearia } from "./actions";

export default async function ConfigPage() {
  const session = await requireDono();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display">Barbearia</h1>
        <p className="text-[var(--color-muted)]">
          Dados gerais que aparecem no sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identidade</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={atualizarBarbearia} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da barbearia</Label>
              <Input id="nome" name="nome" defaultValue={barbearia.nome} required />
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
              <Label htmlFor="logoUrl">URL do logo</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                type="url"
                defaultValue={barbearia.logo_url ?? ""}
                placeholder="https://..."
              />
            </div>

            <Button type="submit">Salvar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
