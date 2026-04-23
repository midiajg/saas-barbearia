"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Star,
  Home,
  Cake,
  Users as UsersIcon,
  Briefcase,
  Dumbbell,
  Phone,
  X,
  MessageCircle,
  Pencil,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adicionarNota, listarNotas } from "./actions";
import { ClienteDialog } from "./cliente-dialog";
import { diasDesde } from "@/lib/utils";
import type { Cliente, Nivel, ClienteNota } from "@/infrastructure/database/schema";

export function ClienteCardDrawer({
  cliente,
  nivel,
  onClose,
}: {
  cliente: Cliente;
  nivel: Nivel | null;
  onClose: () => void;
}) {
  const [notas, setNotas] = useState<ClienteNota[]>([]);
  const [novaNota, setNovaNota] = useState("");
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    listarNotas(cliente.id).then((rows) => setNotas(rows));
  }, [cliente.id]);

  function salvarNota() {
    if (!novaNota.trim()) return;
    const texto = novaNota.trim();
    startTransition(async () => {
      const nova = await adicionarNota(cliente.id, texto);
      setNotas((prev) => [nova, ...prev]);
      setNovaNota("");
    });
  }

  const ultimaVisitaTxt = cliente.ultima_visita
    ? `há ${diasDesde(new Date(cliente.ultima_visita))} dias`
    : "nunca";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-[var(--color-surface)] z-50 border-l border-[var(--color-border)] overflow-auto scrollbar-thin">
        <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] p-4 flex items-center justify-between">
          <h2 className="font-display text-lg">Cliente</h2>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setEditOpen(true)}
              title="Editar"
            >
              <Pencil className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="size-16 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center text-2xl font-medium">
              {cliente.nome.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-medium">{cliente.nome}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-500 font-medium">
                  {cliente.fpts} FPTS
                </span>
                {nivel && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: nivel.numero }).map((_, i) => (
                      <Star
                        key={i}
                        className="size-3.5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                )}
              </div>
              {nivel && (
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  {nivel.nome}
                </p>
              )}
            </div>
          </div>

          <div className="px-3 py-2 rounded-md bg-[var(--color-background)]/40 text-sm flex items-center justify-between">
            <span>Última visita</span>
            <span className="font-medium text-[var(--color-primary)]">
              {ultimaVisitaTxt}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            {cliente.endereco && (
              <Row icon={<Home className="size-4" />} text={cliente.endereco} />
            )}
            {cliente.aniversario && (
              <Row
                icon={<Cake className="size-4" />}
                text={new Date(cliente.aniversario).toLocaleDateString("pt-BR")}
              />
            )}
            {cliente.filhos && (
              <Row
                icon={<UsersIcon className="size-4" />}
                text={cliente.filhos}
              />
            )}
            {cliente.profissao && (
              <Row
                icon={<Briefcase className="size-4" />}
                text={cliente.profissao}
              />
            )}
            {cliente.hobby && (
              <Row
                icon={<Dumbbell className="size-4" />}
                text={cliente.hobby}
              />
            )}
            {cliente.telefone && (
              <Row
                icon={<Phone className="size-4" />}
                text={cliente.telefone}
              />
            )}
          </div>

          {nivel?.beneficios ? (
            <div className="p-3 rounded-md border border-yellow-500/30 bg-yellow-500/5 space-y-1">
              <p className="text-xs uppercase tracking-wider text-yellow-500/80 font-semibold">
                Benefícios {nivel.nome}
              </p>
              {nivel.beneficios.descontoProdutos ? (
                <p className="text-sm">
                  {nivel.beneficios.descontoProdutos}% em produtos
                </p>
              ) : null}
              {nivel.beneficios.bonusIndicacao ? (
                <p className="text-sm">
                  {nivel.beneficios.bonusIndicacao}% trazendo um amigo
                </p>
              ) : null}
              {nivel.beneficios.servicosGratis?.map((s, i) => (
                <p key={i} className="text-sm">{s}</p>
              ))}
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <MessageCircle className="size-4" />
                Notas de relacionamento
              </h3>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: viaja amanhã pros EUA..."
                value={novaNota}
                onChange={(e) => setNovaNota(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && salvarNota()}
              />
              <Button
                size="icon"
                onClick={salvarNota}
                disabled={pending || !novaNota.trim()}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            {notas.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)]">
                Nenhuma nota ainda.
              </p>
            ) : (
              <ul className="space-y-2">
                {notas.map((n) => (
                  <li
                    key={n.id}
                    className="p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-background)]/40"
                  >
                    <p className="text-sm">{n.texto}</p>
                    <p className="text-[10px] text-[var(--color-muted)] mt-1">
                      {new Date(n.criado_em).toLocaleString("pt-BR")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <ClienteDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editing={cliente}
      />
    </>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[var(--color-muted)]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
