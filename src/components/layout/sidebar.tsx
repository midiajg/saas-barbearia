"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  ShoppingBag,
  Wallet,
  CreditCard,
  BarChart3,
  Clock,
  MessageCircle,
  Settings,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/infrastructure/database/types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
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
        href: "/barbeiros",
        label: "Barbeiros",
        icon: UserCircle,
        roles: ["owner", "manager"],
      },
      { href: "/clientes", label: "Clientes", icon: Users },
      {
        href: "/servicos",
        label: "Serviços",
        icon: Scissors,
        roles: ["owner", "manager"],
      },
      {
        href: "/produtos",
        label: "Produtos",
        icon: ShoppingBag,
        roles: ["owner", "manager"],
      },
    ],
  },
  {
    label: "Financeiro",
    items: [
      {
        href: "/financeiro/comissoes",
        label: "Comissões",
        icon: Wallet,
      },
      {
        href: "/financeiro/pagamentos",
        label: "Pagamentos",
        icon: CreditCard,
        roles: ["owner", "manager"],
      },
      {
        href: "/financeiro/relatorios",
        label: "Relatórios",
        icon: BarChart3,
        roles: ["owner", "manager"],
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
        roles: ["owner", "manager"],
      },
      {
        href: "/config/whatsapp",
        label: "WhatsApp",
        icon: MessageCircle,
        roles: ["owner", "manager"],
      },
      {
        href: "/config",
        label: "Barbearia",
        icon: Settings,
        roles: ["owner"],
      },
    ],
  },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const visivel = SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((i) => !i.roles || i.roles.includes(role)),
  })).filter((s) => s.items.length > 0);

  return (
    <aside className="w-60 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
      <div className="px-6 py-5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-[var(--color-primary)] flex items-center justify-center">
            <Scissors className="size-4 text-[var(--color-primary-foreground)]" />
          </div>
          <span className="font-display text-lg">Barbearia</span>
        </div>
      </div>

      <nav className="flex-1 overflow-auto scrollbar-thin px-3 py-4 space-y-5">
        {visivel.map((section, i) => (
          <div key={i}>
            {section.label ? (
              <p className="px-3 mb-2 text-[10px] font-semibold tracking-wider uppercase text-[var(--color-muted-foreground)]">
                {section.label}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          : "text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
