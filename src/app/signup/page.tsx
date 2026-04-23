import Link from "next/link";
import { signupAction } from "./actions";
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

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Criar barbearia</CardTitle>
          <CardDescription>
            Cadastre sua barbearia e crie a conta de dono
          </CardDescription>
        </CardHeader>
        <form action={signupAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomeBarbearia">Nome da barbearia</Label>
              <Input id="nomeBarbearia" name="nomeBarbearia" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Seu nome</Label>
              <Input id="nome" name="nome" required />
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
                required
                autoComplete="new-password"
                minLength={8}
              />
              <p className="text-xs text-[var(--color-muted)]">
                Mínimo 8 caracteres
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full">
              Criar barbearia
            </Button>
            <p className="text-xs text-[var(--color-muted)] text-center">
              Já tem conta?{" "}
              <Link href="/login" className="text-[var(--color-primary)] hover:underline">
                Entrar
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
