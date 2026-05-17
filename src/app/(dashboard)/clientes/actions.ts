"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import type { SessionEquipe } from "@/lib/auth/jwt";
import type { DadosPessoais } from "@/infrastructure/database/types";

// Barbeiro só pode mexer em clientes que ele atendeu/atenderá.
// Dono e gerente passam livre.
async function garantirAcessoAoCliente(
  session: SessionEquipe,
  clienteId: string
) {
  if (session.cargo !== "barbeiro") return;
  const atRepo = new AtendimentosRepo(session.barbeariaId);
  const idsPermitidos = await atRepo.clienteIdsDoBarbeiro(session.equipeId);
  if (!idsPermitidos.has(clienteId)) {
    throw new Error("Você só pode mexer em clientes que atendeu");
  }
}

const baseSchema = z.object({
  nome: z.string().min(2),
  telefone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  foto_url: z.string().url().optional().or(z.literal("")),
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
    foto_url: formData.get("foto_url"),
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
  await garantirAcessoAoCliente(session, id);
  const data = parse(formData);
  const repo = new ClientesRepo(session.barbeariaId);
  await repo.atualizar(id, {
    nome: data.nome,
    telefone: data.telefone || null,
    email: data.email || null,
    foto_url: data.foto_url || null,
    dados_pessoais: toDadosPessoais(data),
  });
  revalidatePath("/clientes");
}

import type { TipoEventoFpts } from "@/infrastructure/database/types";

export async function registrarEventoFpts(
  clienteId: string,
  tipo: TipoEventoFpts,
  descricao?: string,
  pontosOverride?: number
) {
  const session = await requireSession();
  await garantirAcessoAoCliente(session, clienteId);
  const clientesRepo = new ClientesRepo(session.barbeariaId);
  const barbeariasRepo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await barbeariasRepo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  // Determina os pontos: regra do config pros tipos fixos, override pra ajuste manual
  let pontos: number;
  if (pontosOverride != null) {
    pontos = pontosOverride;
  } else {
    const regras = barbearia.config.fpts_regras;
    switch (tipo) {
      case "google":
        pontos = regras.google;
        break;
      case "indicacao":
        pontos = regras.indicacao;
        break;
      case "instagram":
        pontos = regras.instagram;
        break;
      case "aniversario":
        pontos = regras.aniversario;
        break;
      case "pontualidade":
        pontos = regras.pontualidade;
        break;
      default:
        throw new Error("Tipo de evento exige pontos explícitos");
    }
  }

  await clientesRepo.registrarEvento(
    clienteId,
    { tipo, pontos, descricao },
    barbearia.config.niveis
  );
  revalidatePath("/clientes");
  revalidatePath("/agenda");
}

export async function registrarPontuacaoCustom(
  clienteId: string,
  pontuacaoId: string
) {
  const session = await requireSession();
  await garantirAcessoAoCliente(session, clienteId);
  const clientesRepo = new ClientesRepo(session.barbeariaId);
  const barbeariasRepo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await barbeariasRepo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const regra = (barbearia.config.pontuacoes_custom ?? []).find(
    (p) => p.id === pontuacaoId && p.ativo
  );
  if (!regra) throw new Error("Pontuação personalizada não encontrada");

  await clientesRepo.registrarEvento(
    clienteId,
    {
      tipo: "ajuste",
      pontos: regra.valor,
      descricao: `${regra.icone} ${regra.label}`,
    },
    barbearia.config.niveis
  );
  revalidatePath("/clientes");
  revalidatePath("/agenda");
}

export async function deletarCliente(id: string) {
  const session = await requireSession();
  await garantirAcessoAoCliente(session, id);
  const repo = new ClientesRepo(session.barbeariaId);
  await repo.deletar(id);
  revalidatePath("/clientes");
}
