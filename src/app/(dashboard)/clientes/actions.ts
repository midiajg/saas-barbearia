"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import type { DadosPessoais } from "@/infrastructure/database/types";

const baseSchema = z.object({
  nome: z.string().min(2),
  telefone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  endereco: z.string().optional().or(z.literal("")),
  aniversario: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  filhos: z.string().optional().or(z.literal("")),
  profissao: z.string().optional().or(z.literal("")),
  hobby: z.string().optional().or(z.literal("")),
});

function parse(formData: FormData) {
  return baseSchema.parse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    endereco: formData.get("endereco"),
    aniversario: formData.get("aniversario"),
    filhos: formData.get("filhos"),
    profissao: formData.get("profissao"),
    hobby: formData.get("hobby"),
  });
}

function toDadosPessoais(
  data: z.infer<typeof baseSchema>
): DadosPessoais | null {
  const d: DadosPessoais = {};
  if (data.endereco) d.endereco = data.endereco;
  if (data.aniversario) d.aniversario = data.aniversario;
  if (data.filhos) d.filhos = data.filhos;
  if (data.profissao) d.profissao = data.profissao;
  if (data.hobby) d.hobby = data.hobby;
  return Object.keys(d).length > 0 ? d : null;
}

export async function criarCliente(formData: FormData) {
  const session = await requireSession();
  const data = parse(formData);
  const repo = new ClientesRepo(session.barbeariaId);
  await repo.criar({
    nome: data.nome,
    telefone: data.telefone || undefined,
    email: data.email || undefined,
    dadosPessoais: toDadosPessoais(data) ?? undefined,
  });
  revalidatePath("/clientes");
}

export async function atualizarCliente(id: string, formData: FormData) {
  const session = await requireSession();
  const data = parse(formData);
  const repo = new ClientesRepo(session.barbeariaId);
  await repo.atualizar(id, {
    nome: data.nome,
    telefone: data.telefone || null,
    email: data.email || null,
    dados_pessoais: toDadosPessoais(data),
  });
  revalidatePath("/clientes");
}

export async function ajustarFpts(
  clienteId: string,
  pontos: number,
  descricao: string
) {
  const session = await requireSession();
  const clientesRepo = new ClientesRepo(session.barbeariaId);
  const barbeariasRepo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await barbeariasRepo.get();
  await clientesRepo.registrarEvento(
    clienteId,
    { tipo: "ajuste", pontos, descricao },
    barbearia?.config.niveis ?? []
  );
  revalidatePath("/clientes");
}

export async function deletarCliente(id: string) {
  const session = await requireSession();
  const repo = new ClientesRepo(session.barbeariaId);
  await repo.deletar(id);
  revalidatePath("/clientes");
}
