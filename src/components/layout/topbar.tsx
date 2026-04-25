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
    <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        {onMenuClick && MenuIcon && (
          <button
            onClick={onMenuClick}
            className="size-9 rounded-md flex items-center justify-center text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)] transition-colors md:hidden"
            aria-label="Abrir menu"
          >
            <MenuIcon className="size-5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="size-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] font-medium">
            {nome.slice(0, 1).toUpperCase()}
          </div>
          <div className="hidden sm:block max-w-[160px]">
            <p className="font-medium leading-tight truncate">{nome}</p>
            <p className="text-xs text-[var(--color-muted)] leading-tight truncate">
              {email}
            </p>
          </div>
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
