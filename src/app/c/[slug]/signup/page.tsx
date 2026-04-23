import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarOrganizationPorSlug } from "@/infrastructure/database/repositories/organization.repo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signupClienteAction } from "./actions";

export default async function ClienteSignupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await buscarOrganizationPorSlug(slug);
  if (!org) notFound();

  const action = signupClienteAction.bind(null, slug);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Criar conta — {org.nome}</CardTitle>
          <CardDescription>
            Comece a ganhar pontos a cada corte
          </CardDescription>
        </CardHeader>
        <form action={action}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
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
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
              />
              <p className="text-xs text-[var(--color-muted)]">
                Mínimo 8 caracteres
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
