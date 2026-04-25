"use client";

import { LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function Topbar({
  nome,
  email,
  onMenuClick,
  MenuIcon,
}: {
  nome: string;
  email: string;
  onMenuClick?: () => void;
  MenuIcon?: LucideIcon;
}) {
  async function handleLogout() {
    await fetch("/api/auth/logout?tipo=equipe", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="h-14 border-b border-[var(--color-hairline)] bg-[var(--color-background)] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onMenuClick && MenuIcon && (
          <button
            onClick={onMenuClick}
            className="size-9 flex items-center justify-center text-[var(--color-foreground)] hover:bg-[var(--color-surface)] transition-colors md:hidden"
            aria-label="Abrir menu"
          >
            <MenuIcon className="size-5" />
          </button>
        )}
        <p className="hidden md:block font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)]">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </p>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="size-8 flex items-center justify-center bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-display text-base">
            {nome.slice(0, 1).toUpperCase()}
          </div>
          <div className="hidden sm:block max-w-[180px] text-right">
            <p className="font-medium leading-tight truncate">{nome}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)] leading-tight truncate">
              {email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="size-9 flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)] transition-colors"
          title="Sair"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
