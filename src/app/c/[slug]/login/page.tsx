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
import { loginClienteAction } from "./actions";

export default async function ClienteLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await buscarOrganizationPorSlug(slug);
  if (!org) notFound();

  const action = loginClienteAction.bind(null, slug);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar — {org.nome}</CardTitle>
          <CardDescription>
            Acesse seu cashback e histórico de visitas
          </CardDescription>
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
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
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
              Ainda não tem conta?{" "}
              <Link
                href={`/c/${slug}/signup`}
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
