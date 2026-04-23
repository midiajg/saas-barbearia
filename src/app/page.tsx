import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-border)] text-xs text-[var(--color-muted)]">
          <span className="size-1.5 rounded-full bg-[var(--color-primary)]" />
          Sistema de gestão para barbearias
        </div>

        <h1 className="text-5xl font-medium tracking-tight">
          O cliente que volta é o que
          <br />
          <span className="text-[var(--color-primary)]">se lembra de você.</span>
        </h1>

        <p className="text-lg text-[var(--color-muted)] leading-relaxed">
          Agenda, CRM relacional, fidelidade e financeiro em um lugar só.
          Sem planilha, sem caderninho, sem cliente esquecido.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/login"
            className="px-6 py-3 rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            Criar barbearia
          </Link>
        </div>
      </div>
    </main>
  );
}
