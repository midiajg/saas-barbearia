"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  ShoppingBag,
  Package2,
  Wallet,
  BarChart3,
  Clock,
  MessageCircle,
  Settings,
  UserCircle,
  Gem,
  Coins,
  Award,
  Receipt,
  Ban,
  CircleDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cargo } from "@/infrastructure/database/types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  cargos?: Cargo[];
};

type NavSection = { label?: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/agenda", label: "Agenda", icon: Calendar },
    ],
  },
  {
    label: "Gestão",
    items: [
      {
        href: "/equipe",
        label: "Equipe",
        icon: UserCircle,
        cargos: ["dono", "gerente"],
      },
      { href: "/clientes", label: "Clientes", icon: Users },
      {
        href: "/servicos",
        label: "Serviços",
        icon: Scissors,
        cargos: ["dono", "gerente"],
      },
      {
        href: "/produtos",
        label: "Produtos",
        icon: ShoppingBag,
        cargos: ["dono", "gerente"],
      },
      {
        href: "/produtos/pacotes",
        label: "Pacotes",
        icon: Package2,
        cargos: ["dono", "gerente"],
      },
    ],
  },
  {
    label: "Financeiro",
    items: [
      {
        href: "/financeiro/caixa",
        label: "Caixa do dia",
        icon: CircleDollarSign,
        cargos: ["dono", "gerente"],
      },
      { href: "/financeiro/comissoes", label: "Comissões", icon: Wallet },
      {
        href: "/financeiro/despesas",
        label: "Despesas",
        icon: Receipt,
        cargos: ["dono", "gerente"],
      },
      {
        href: "/financeiro/relatorios",
        label: "Relatórios",
        icon: BarChart3,
        cargos: ["dono", "gerente"],
      },
    ],
  },
  {
    label: "Configurações",
    items: [
      {
        href: "/config/horarios",
        label: "Horários",
        icon: Clock,
        cargos: ["dono", "gerente"],
      },
      {
        href: "/config/bloqueios",
        label: "Bloqueios (folga)",
        icon: Ban,
        // Barbeiro também acessa pra bloquear a própria agenda.
        cargos: ["dono", "gerente", "barbeiro"],
      },
      {
        href: "/config/fpts",
        label: "FPTS & Cashback",
        icon: Coins,
        cargos: ["dono", "gerente"],
      },
      {
        href: "/config/niveis",
        label: "Níveis",
        icon: Award,
        cargos: ["dono", "gerente"],
      },
      {
        href: "/config/whatsapp",
        label: "WhatsApp",
        icon: MessageCircle,
        cargos: ["dono", "gerente"],
      },
      {
        href: "/config/assinatura",
        label: "Assinatura",
        icon: Gem,
        cargos: ["dono"],
      },
      {
        href: "/config",
        label: "Barbearia",
        icon: Settings,
        cargos: ["dono"],
      },
    ],
  },
];

export function Sidebar({ cargo }: { cargo: Cargo }) {
  const pathname = usePathname();

  const visivel = SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((i) => !i.cargos || i.cargos.includes(cargo)),
  })).filter((s) => s.items.length > 0);

  return (
    <aside className="h-full w-full border-r border-[var(--color-border)] bg-[var(--color-background)] flex flex-col">
      {/* Cabeçalho — letterhead miniatura */}
      <div className="px-5 pt-6 pb-5 border-b border-[var(--color-hairline)]">
        <div className="flex items-center gap-3">
          <div className="size-9 flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
            <Scissors className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-base leading-tight">
              Caderno do
              <br />
              <em className="display-italic">Salão</em>
            </p>
          </div>
        </div>
        <p className="mt-3 font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)]">
          Sistema · MMXXVI
        </p>
      </div>

      <nav className="flex-1 overflow-auto scrollbar-thin px-3 py-5 space-y-6">
        {visivel.map((section, i) => (
          <div key={i}>
            {section.label ? (
              <p className="px-3 mb-3 font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--color-muted-foreground)]">
                {section.label}
              </p>
            ) : null}
            <ul className="space-y-px">
              {section.items.map((item) => {
                const hasSubItem = section.items.some(
                  (other) =>
                    other !== item && other.href.startsWith(item.href + "/")
                );
                const isActive = hasSubItem
                  ? pathname === item.href
                  : pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href + "/"));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2 text-sm transition-all relative",
                        isActive
                          ? "text-[var(--color-foreground)]"
                          : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                      )}
                    >
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-2 bottom-2 w-px bg-[var(--color-primary)]"
                        />
                      )}
                      <Icon
                        className={cn(
                          "size-3.5 shrink-0 transition-colors",
                          isActive
                            ? "text-[var(--color-primary)]"
                            : "text-[var(--color-muted-foreground)] group-hover:text-[var(--color-muted)]"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-[var(--color-hairline)]">
        <p className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted-foreground)]">
          Edição 001 · {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </p>
      </div>
    </aside>
  );
}
