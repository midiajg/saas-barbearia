"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffSession } from "@/lib/auth/session";
import { AgendamentosRepo } from "@/infrastructure/database/repositories/agendamentos.repo";
import { ServicosRepo } from "@/infrastructure/database/repositories/servicos.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { calcularPreco } from "@/domain/precificacao";

const schema = z.object({
  barbeiroId: z.string().uuid(),
  clienteId: z.string().uuid().nullable(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horario: z.string().regex(/^\d{2}:\d{2}$/),
  servicoIds: z.array(z.string().uuid()).min(1),
});

export async function criarAgendamentoAction(
  input: z.infer<typeof schema>
): Promise<{ id: string }> {
  const session = await requireStaffSession();
  const data = schema.parse(input);

  const servicosRepo = new ServicosRepo(session.orgId);
  const clientesRepo = new ClientesRepo(session.orgId);
  const agRepo = new AgendamentosRepo(session.orgId);

  const todosServicos = await servicosRepo.list({ ativosOnly: true });
  const selecionados = todosServicos.filter((s) => data.servicoIds.includes(s.id));
  if (selecionados.length === 0) throw new Error("Serviço inválido");

  const ultimaVisita = data.clienteId
    ? await clientesRepo.ultimaVisitaConcluida(data.clienteId)
    : null;

  const itens = selecionados.map((s) => {
    const { preco } = calcularPreco(s, ultimaVisita);
    return {
      servicoId: s.id,
      nome: s.nome,
      preco,
      duracaoMin: s.duracaoMin,
    };
  });

  const duracaoTotal = itens.reduce((acc, i) => acc + i.duracaoMin, 0);
  const valorTotal = itens.reduce((acc, i) => acc + i.preco, 0);

  const inicio = new Date(`${data.data}T${data.horario}:00`);
  const fim = new Date(inicio.getTime() + duracaoTotal * 60 * 1000);

  const created = await agRepo.create({
    barbeiroId: data.barbeiroId,
    clienteId: data.clienteId ?? undefined,
    inicio,
    fim,
    servicos: itens,
    valorTotal: valorTotal.toFixed(2),
  });

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  return { id: created.id };
}

export async function atualizarStatusAction(
  id: string,
  status:
    | "agendado"
    | "confirmado"
    | "em_atendimento"
    | "realizado"
    | "no_show"
    | "cancelado"
) {
  const session = await requireStaffSession();
  const repo = new AgendamentosRepo(session.orgId);
  await repo.updateStatus(id, status);
  revalidatePath("/agenda");
}

export async function cancelarAgendamentoAction(id: string) {
  const session = await requireStaffSession();
  const repo = new AgendamentosRepo(session.orgId);
  await repo.cancelar(id);
  revalidatePath("/agenda");
}
