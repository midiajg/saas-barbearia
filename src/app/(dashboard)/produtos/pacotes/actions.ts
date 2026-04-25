"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireDonoOuGerente, requireSession } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import type {
  Pacote,
  PacoteAtivo,
} from "@/infrastructure/database/types";

const schema = z.object({
  nome: z.string().min(2),
  descricao: z.string().optional(),
  preco: z.coerce.number().min(0),
  quantidade: z.coerce.number().int().min(0).optional(),
  ilimitado: z.coerce.boolean().optional(),
  recorrente: z.coerce.boolean().optional(),
  duracao_dias: z.coerce.number().int().min(1),
  servicos_inclusos: z.array(z.string().uuid()).optional(),
});

function parse(formData: FormData) {
  const servicos: string[] = [];
  for (const v of formData.getAll("servicos_inclusos")) {
    if (typeof v === "string" && v) servicos.push(v);
  }
  return schema.parse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || undefined,
    preco: formData.get("preco"),
    quantidade: formData.get("quantidade") || undefined,
    ilimitado: formData.get("ilimitado") === "on",
    recorrente: formData.get("recorrente") === "on",
    duracao_dias: formData.get("duracao_dias"),
    servicos_inclusos: servicos,
  });
}

export async function criarPacote(formData: FormData) {
  const session = await requireDonoOuGerente();
  const data = parse(formData);
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const novo: Pacote = {
    id: randomUUID(),
    nome: data.nome,
    descricao: data.descricao,
    preco: data.preco,
    quantidade: data.ilimitado
      ? null
      : (data.quantidade && data.quantidade > 0 ? data.quantidade : 1),
    recorrente: data.recorrente ?? false,
    duracao_dias: data.duracao_dias,
    servicos_inclusos: data.servicos_inclusos ?? [],
    ativo: true,
  };

  await repo.salvarPacotes([...(barbearia.config.pacotes ?? []), novo]);
  revalidatePath("/produtos/pacotes");
}

export async function atualizarPacote(id: string, formData: FormData) {
  const session = await requireDonoOuGerente();
  const data = parse(formData);
  const ativo = formData.get("ativo") === "on";
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const lista = (barbearia.config.pacotes ?? []).map((p) =>
    p.id === id
      ? {
          ...p,
          nome: data.nome,
          descricao: data.descricao,
          preco: data.preco,
          quantidade: data.ilimitado
            ? null
            : (data.quantidade && data.quantidade > 0 ? data.quantidade : 1),
          recorrente: data.recorrente ?? false,
          duracao_dias: data.duracao_dias,
          servicos_inclusos: data.servicos_inclusos ?? [],
          ativo,
        }
      : p
  );
  await repo.salvarPacotes(lista);
  revalidatePath("/produtos/pacotes");
}

export async function deletarPacote(id: string) {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");
  await repo.salvarPacotes(
    (barbearia.config.pacotes ?? []).filter((p) => p.id !== id)
  );
  revalidatePath("/produtos/pacotes");
}

const venderSchema = z.object({
  clienteId: z.string().uuid(),
  pacoteId: z.string().uuid(),
});

export async function venderPacoteAoCliente(
  input: z.infer<typeof venderSchema>
) {
  const session = await requireSession();
  const data = venderSchema.parse(input);

  const barbeariasRepo = new BarbeariasRepo(session.barbeariaId);
  const clientesRepo = new ClientesRepo(session.barbeariaId);

  const barbearia = await barbeariasRepo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const pacote = (barbearia.config.pacotes ?? []).find(
    (p) => p.id === data.pacoteId
  );
  if (!pacote) throw new Error("Pacote não encontrado");
  if (!pacote.ativo) throw new Error("Pacote inativo");

  const cliente = await clientesRepo.get(data.clienteId);
  if (!cliente) throw new Error("Cliente não encontrado");

  const inicio = new Date();
  const fim = new Date(
    inicio.getTime() + pacote.duracao_dias * 24 * 60 * 60 * 1000
  );

  const ativo: PacoteAtivo = {
    pacote_id: pacote.id,
    nome: pacote.nome,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    usos_iniciais: pacote.quantidade,
    usos_restantes: pacote.quantidade,
    recorrente: pacote.recorrente,
    servicos_inclusos: [...pacote.servicos_inclusos],
  };

  await clientesRepo.setPacoteAtivo(cliente.id, ativo);
  revalidatePath("/clientes");
}

export async function cancelarPacoteDoCliente(clienteId: string) {
  const session = await requireDonoOuGerente();
  const clientesRepo = new ClientesRepo(session.barbeariaId);
  await clientesRepo.setPacoteAtivo(clienteId, null);
  revalidatePath("/clientes");
}
