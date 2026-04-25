import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eyebrow, DoubleRule } from "@/components/editorial";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Letterhead */}
      <header className="px-6 sm:px-10 pt-6 pb-4">
        <div className="max-w-5xl mx-auto">
          <DoubleRule className="mb-3" />
          <div className="flex items-center justify-between text-xs">
            <Link
              href="/"
              className="font-mono tracking-widest text-[var(--color-muted)] uppercase hover:text-[var(--color-foreground)] transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="size-3" /> Voltar
            </Link>
            <span className="font-mono tracking-widest text-[var(--color-muted)] uppercase">
              Caderno do Salão
            </span>
            <span className="font-mono tracking-widest text-[var(--color-primary)] uppercase hidden sm:inline">
              Painel
            </span>
          </div>
          <DoubleRule className="mt-3" />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10 animate-rise">
            <Eyebrow className="justify-center mb-6">
              Acesso restrito · Equipe
            </Eyebrow>
            <h1 className="display-serif text-5xl sm:text-6xl mb-3">
              Entre <em className="display-italic">no salão.</em>
            </h1>
            <p className="text-sm text-[var(--color-muted)]">
              Painel de gestão pra dono, gerente ou barbeiro.
            </p>
          </div>

          <form action={loginAction} className="space-y-5 animate-rise" style={{ animationDelay: "150ms" }}>
            <div className="space-y-2">
              <Label htmlFor="email" className="eyebrow">
                Endereço de email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                autoComplete="email"
                className="h-12 bg-transparent border-x-0 border-t-0 border-b border-[var(--color-border-strong)] rounded-none px-0 focus-visible:border-[var(--color-primary)] focus-visible:ring-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="eyebrow">
                Senha
              </Label>
              <Input
                id="password"
                name="password"
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
              Ainda não tem conta?{" "}
              <Link
                href="/signup"
                className="text-[var(--color-foreground)] hover:text-[var(--color-primary)] underline underline-offset-4 transition-colors"
              >
                Criar barbearia
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
