import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarBarbeariaPorSlug } from "@/infrastructure/database/repositories/barbearias.repo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginClienteAction } from "./actions";

export default async function LoginClientePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const barbearia = await buscarBarbeariaPorSlug(slug);
  if (!barbearia) notFound();

  const action = loginClienteAction.bind(null, slug);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-background)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <p className="text-sm text-[var(--color-muted)]">{barbearia.nome}</p>
        </CardHeader>
        <form action={action}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full">
              Entrar
            </Button>
            <p className="text-xs text-[var(--color-muted)] text-center">
              Não tem conta?{" "}
              <Link
                href={`/c/${slug}/cadastro`}
                className="text-[var(--color-primary)] hover:underline"
              >
                Criar conta
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
