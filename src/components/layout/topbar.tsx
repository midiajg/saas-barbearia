"use client";

import { LogOut, ChevronDown } from "lucide-react";

export function Topbar({ nome, email }: { nome: string; email: string }) {
  async function handleLogout() {
    await fetch("/api/auth/logout?tipo=equipe", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="size-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] font-medium">
            {nome.slice(0, 1).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="font-medium leading-tight">{nome}</p>
            <p className="text-xs text-[var(--color-muted)] leading-tight">
              {email}
            </p>
          </div>
          <ChevronDown className="size-4 text-[var(--color-muted)]" />
        </div>
        <button
          onClick={handleLogout}
          className="size-9 rounded-md flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)] transition-colors"
          title="Sair"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
