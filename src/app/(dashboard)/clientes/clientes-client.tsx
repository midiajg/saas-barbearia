"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClienteDialog } from "./cliente-dialog";
import { ClienteCardDrawer } from "./cliente-card-drawer";
import { nivelAtual } from "@/domain/fpts";
import { Eyebrow, DoubleRule } from "@/components/editorial";
import type {
  CatalogoServico,
  Cliente,
  FptsRegraCustom,
  FptsRegras,
  Nivel,
  Pacote,
} from "@/infrastructure/database/types";

export function ClientesClient({
  clientes,
  niveis,
  pacotes,
  servicos,
  fptsRegras,
  pontuacoesCustom,
  busca,
}: {
  clientes: Cliente[];
  niveis: Nivel[];
  pacotes: Pacote[];
  servicos: CatalogoServico[];
  fptsRegras: FptsRegras;
  pontuacoesCustom: FptsRegraCustom[];
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
      <header>
        <DoubleRule />
        <div className="py-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <Eyebrow marker className="mb-2">
              Catálogo · Clientes
            </Eyebrow>
            <h1 className="display-serif text-3xl sm:text-4xl">
              Cada cliente, <em className="display-italic">uma história.</em>
            </h1>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-end">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-muted)] tabular-nums">
              {clientes.length.toString().padStart(3, "0")}{" "}
              <span className="text-[var(--color-muted-foreground)]">cadastrados</span>
            </p>
            <Button
              onClick={() => setOpenNovo(true)}
              className="rounded-none h-9 font-mono tracking-widest text-[10px] uppercase"
            >
              <Plus className="size-3.5" /> Novo
            </Button>
          </div>
        </div>
        <DoubleRule />
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-muted)]" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={buscaLocal}
          onChange={(e) => aplicarBusca(e.target.value)}
          className="pl-9 h-10 rounded-none bg-transparent border-[var(--color-hairline)] focus-visible:border-[var(--color-primary)]"
        />
      </div>

      {clientes.length === 0 ? (
        <div className="hairline-t hairline-b py-16 text-center space-y-4">
          <Eyebrow className="justify-center">
            {busca ? "Nada encontrado" : "Lista vazia"}
          </Eyebrow>
          <p className="display-serif text-2xl">
            {busca ? (
              <>
                Não encontramos <em className="display-italic">"{busca}"</em>
              </>
            ) : (
              <>
                Comece <em className="display-italic">do zero.</em>
              </>
            )}
          </p>
          <Button
            onClick={() => setOpenNovo(true)}
            className="rounded-none h-10 font-mono tracking-widest text-[10px] uppercase"
          >
            <Plus className="size-3.5" /> Cadastrar primeiro cliente
          </Button>
        </div>
      ) : (
        <ul className="hairline-t hairline-b">
          {clientes.map((c) => {
            const nivel = nivelAtual(c.fpts, niveis);
            return (
              <li key={c.id} className="hairline-b last:border-b-0">
                <button
                  onClick={() => setDrawerCliente(c)}
                  className="w-full text-left px-1 py-3 sm:py-4 flex items-center gap-4 transition-all hover:px-3 hover:bg-[var(--color-surface)]/40 group"
                >
                  <div className="size-10 sm:size-11 bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-display text-lg shrink-0">
                    {c.nome.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="font-medium truncate">{c.nome}</p>
                      {nivel && (
                        <span className="hidden sm:inline-flex items-center gap-0.5 shrink-0">
                          {Array.from({ length: nivel.numero }).map((_, i) => (
                            <Star
                              key={i}
                              className="size-2.5 fill-[var(--color-warning)] text-[var(--color-warning)]"
                            />
                          ))}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-muted)] mt-0.5">
                      {c.telefone ?? "Sem telefone"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono tabular-nums text-sm text-[var(--color-primary)]">
                      {c.fpts}
                    </p>
                    <p className="font-mono text-[9px] tracking-widest uppercase text-[var(--color-muted)] mt-0.5">
                      FPTS
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
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
          pacotes={pacotes}
          servicos={servicos}
          fptsRegras={fptsRegras}
          pontuacoesCustom={pontuacoesCustom}
          onClose={() => setDrawerCliente(null)}
        />
      )}
    </div>
  );
}
