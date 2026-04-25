"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";
import type { Cargo } from "@/infrastructure/database/types";

export function DashboardShell({
  cargo,
  nome,
  email,
  children,
}: {
  cargo: Cargo;
  nome: string;
  email: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Fecha o drawer ao navegar
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Trava o scroll do body quando o drawer mobile está aberto
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen flex">
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — fixa em desktop, drawer em mobile */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 md:relative md:translate-x-0 md:w-60",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar cargo={cargo} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          nome={nome}
          email={email}
          onMenuClick={() => setSidebarOpen(true)}
          MenuIcon={Menu}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-5 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
