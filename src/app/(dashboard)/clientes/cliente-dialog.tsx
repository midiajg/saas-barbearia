"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { criarCliente, atualizarCliente } from "./actions";
import { FotoUpload } from "@/components/foto-upload";
import type { Cliente } from "@/infrastructure/database/types";

export function ClienteDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Cliente | null;
}) {
  const [pending, startTransition] = useTransition();
  const [fotoUrl, setFotoUrl] = useState<string | null>(editing?.foto_url ?? null);
  const d = editing?.dados_pessoais ?? {};

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (editing) {
          await atualizarCliente(editing.id, formData);
          toast.success("Cliente atualizado");
        } else {
          await criarCliente(formData);
          toast.success("Cliente criado");
        }
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao salvar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar cliente" : "Novo cliente"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Foto</Label>
            <FotoUpload
              value={fotoUrl}
              onChange={setFotoUrl}
              hiddenInputName="foto_url"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={editing?.nome} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                defaultValue={editing?.telefone ?? ""}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aniversario">Aniversário</Label>
              <Input
                id="aniversario"
                name="aniversario"
                type="date"
                defaultValue={d.aniversario ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={editing?.email ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              name="endereco"
              defaultValue={d.endereco ?? ""}
              placeholder="Rua, bairro..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="profissao">Profissão</Label>
              <Input
                id="profissao"
                name="profissao"
                defaultValue={d.profissao ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hobby">Hobby</Label>
              <Input
                id="hobby"
                name="hobby"
                defaultValue={d.hobby ?? ""}
                placeholder="musculação, futebol..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filhos">Filhos</Label>
            <Input
              id="filhos"
              name="filhos"
              defaultValue={d.filhos ?? ""}
              placeholder="Joaquim e Lara"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
