import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buscarBarbeariaPorSlug } from "@/infrastructure/database/repositories/barbearias.repo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eyebrow, DoubleRule } from "@/components/editorial";
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
    <main className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-10 pt-6 pb-4">
        <div className="max-w-3xl mx-auto">
          <DoubleRule className="mb-3" />
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <Link
              href={`/c/${slug}`}
              className="font-mono tracking-widest text-[var(--color-muted)] uppercase hover:text-[var(--color-foreground)] transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="size-3" /> Voltar
            </Link>
            <span className="font-mono tracking-widest text-[var(--color-muted)] uppercase">
              {barbearia.slug}
            </span>
            <span className="font-mono tracking-widest text-[var(--color-primary)] uppercase">
              Entrar
            </span>
          </div>
          <DoubleRule className="mt-3" />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-5 sm:px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10 animate-rise">
            <Eyebrow className="justify-center mb-6">Já é cliente</Eyebrow>
            <h1 className="display-serif text-4xl sm:text-5xl mb-3">
              Bem-vindo de <em className="display-italic">volta.</em>
            </h1>
            <p className="text-sm text-[var(--color-muted)]">{barbearia.nome}</p>
          </div>

          <form action={action} className="space-y-5 animate-rise" style={{ animationDelay: "150ms" }}>
            <div className="space-y-2">
              <Label htmlFor="email" className="eyebrow">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-12 bg-transparent border-x-0 border-t-0 border-b border-[var(--color-border-strong)] rounded-none px-0 focus-visible:border-[var(--color-primary)] focus-visible:ring-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha" className="eyebrow">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                required
                autoComplete="current-password"
                className="h-12 bg-transparent border-x-0 border-t-0 border-b border-[var(--color-border-strong)] rounded-none px-0 focus-visible:border-[var(--color-primary)] focus-visible:ring-0"
              />
            </div>
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-12 rounded-none font-mono tracking-widest text-xs uppercase"
              >
                Entrar →
              </Button>
            </div>
            <p className="text-xs text-[var(--color-muted)] text-center pt-4 hairline-t">
              Não tem conta?{" "}
              <Link
                href={`/c/${slug}/cadastro`}
                className="text-[var(--color-foreground)] hover:text-[var(--color-primary)] underline underline-offset-4 transition-colors"
              >
                Criar conta
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
