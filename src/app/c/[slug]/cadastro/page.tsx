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
import { cadastrarClienteAction } from "./actions";

export default async function CadastroPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { slug } = await params;
  const { ref } = await searchParams;
  const barbearia = await buscarBarbeariaPorSlug(slug);
  if (!barbearia) notFound();

  const action = cadastrarClienteAction.bind(null, slug);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10 bg-[var(--color-background)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <p className="text-sm text-[var(--color-muted)]">
            {barbearia.nome}
          </p>
          {ref && (
            <p className="text-xs text-[var(--color-primary)] mt-1">
              🤝 Você foi indicado por um amigo
            </p>
          )}
        </CardHeader>
        <form action={action}>
          {ref && <input type="hidden" name="ref" value={ref} />}
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                required
                minLength={6}
              />
              <p className="text-xs text-[var(--color-muted)]">
                Mínimo 6 caracteres
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full">
              Criar conta
            </Button>
            <p className="text-xs text-[var(--color-muted)] text-center">
              Já tem conta?{" "}
              <Link
                href={`/c/${slug}/login`}
                className="text-[var(--color-primary)] hover:underline"
              >
                Entrar
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
