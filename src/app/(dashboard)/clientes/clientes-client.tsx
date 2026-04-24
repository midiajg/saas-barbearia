"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ClienteDialog } from "./cliente-dialog";
import { ClienteCardDrawer } from "./cliente-card-drawer";
import { nivelAtual } from "@/domain/fpts";
import type {
  Cliente,
  FptsRegras,
  Nivel,
} from "@/infrastructure/database/types";

export function ClientesClient({
  clientes,
  niveis,
  fptsRegras,
  busca,
}: {
  clientes: Cliente[];
  niveis: Nivel[];
  fptsRegras: FptsRegras;
  busca: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [openNovo, setOpenNovo] = useState(false);
  const [drawerCliente, setDrawerCliente] = useState<Cliente | null>(null);
  const [buscaLocal, setBuscaLocal] = useState(busca);

  function aplicarBusca(q: string) {
    setBuscaLocal(q);
    startTransition(() =>
      router.push(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ""}`)
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display">Clientes</h1>
          <p className="text-[var(--color-muted)]">
            Cada cliente é uma história. Não esqueça nenhuma.
          </p>
        </div>
        <Button onClick={() => setOpenNovo(true)}>
          <Plus className="size-4" /> Novo cliente
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-muted)]" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={buscaLocal}
          onChange={(e) => aplicarBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {clientes.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-[var(--color-muted)] mb-3">
              {busca
                ? "Nenhum cliente encontrado para esta busca."
                : "Nenhum cliente cadastrado ainda."}
            </p>
            <Button onClick={() => setOpenNovo(true)}>
              <Plus className="size-4" /> Cadastrar cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {clientes.map((c) => {
            const nivel = nivelAtual(c.fpts, niveis);
            return (
              <button
                key={c.id}
                onClick={() => setDrawerCliente(c)}
                className="text-left"
              >
                <Card className="hover:border-[var(--color-primary)]/40 transition-colors h-full">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="size-12 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center font-medium shrink-0">
                      {c.nome.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{c.nome}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {c.telefone ?? "Sem telefone"}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        {nivel ? (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: nivel.numero }).map((_, i) => (
                              <Star
                                key={i}
                                className="size-3 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                        ) : null}
                        <span className="text-[10px] text-[var(--color-muted)] ml-1">
                          {c.fpts} FPTS
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <ClienteDialog
        open={openNovo}
        onOpenChange={setOpenNovo}
        editing={null}
      />

      {drawerCliente && (
        <ClienteCardDrawer
          cliente={drawerCliente}
          nivel={nivelAtual(drawerCliente.fpts, niveis)}
          niveis={niveis}
          fptsRegras={fptsRegras}
          onClose={() => setDrawerCliente(null)}
        />
      )}
    </div>
  );
}
