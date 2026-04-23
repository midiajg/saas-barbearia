"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffSession } from "@/lib/auth/session";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";

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

function nullify<T extends Record<string, string | undefined>>(
  obj: T
): { [K in keyof T]: string | undefined } {
  const out = {} as { [K in keyof T]: string | undefined };
  for (const k in obj) {
    out[k] = obj[k] === "" ? undefined : obj[k];
  }
  return out;
}

export async function criarCliente(formData: FormData) {
  const session = await requireStaffSession();
  const data = nullify(parse(formData));
  const repo = new ClientesRepo(session.orgId);
  await repo.create({
    nome: data.nome!,
    telefone: data.telefone,
    email: data.email,
    endereco: data.endereco,
    aniversario: data.aniversario,
    filhos: data.filhos,
    profissao: data.profissao,
    hobby: data.hobby,
  });
  revalidatePath("/clientes");
}

export async function atualizarCliente(id: string, formData: FormData) {
  const session = await requireStaffSession();
  const data = parse(formData);
  const repo = new ClientesRepo(session.orgId);
  await repo.update(id, {
    nome: data.nome,
    telefone: data.telefone || null,
    email: data.email || null,
    endereco: data.endereco || null,
    aniversario: data.aniversario || null,
    filhos: data.filhos || null,
    profissao: data.profissao || null,
    hobby: data.hobby || null,
  });
  revalidatePath("/clientes");
}

export async function adicionarNota(clienteId: string, texto: string) {
  const session = await requireStaffSession();
  if (!texto.trim()) throw new Error("Nota vazia");
  const repo = new ClientesRepo(session.orgId);
  const nota = await repo.addNota(clienteId, texto.trim(), session.userId);
  revalidatePath("/clientes");
  return nota;
}

export async function listarNotas(clienteId: string) {
  const session = await requireStaffSession();
  const repo = new ClientesRepo(session.orgId);
  return repo.listNotas(clienteId);
}

export async function ajustarFpts(
  clienteId: string,
  pontos: number,
  descricao: string
) {
  const session = await requireStaffSession();
  const repo = new ClientesRepo(session.orgId);
  await repo.addFptsEvento({
    clienteId,
    tipo: "ajuste_manual",
    pontos,
    descricao,
  });
  revalidatePath("/clientes");
}
