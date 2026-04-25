"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireClienteSession } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { calcularPreco } from "@/domain/precificacao";

const schema = z.object({
  slug: z.string(),
  barbeiroId: z.string().uuid(),
  servicoIds: z.array(z.string().uuid()).min(1),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horario: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function confirmarAgendamentoCliente(
  input: z.infer<typeof schema>
): Promise<{ id: string }> {
  const session = await requireClienteSession(input.slug);
  const data = schema.parse(input);

  const barbeariasRepo = new BarbeariasRepo(session.barbeariaId);
  const atRepo = new AtendimentosRepo(session.barbeariaId);
  const clientesRepo = new ClientesRepo(session.barbeariaId);

  const barbearia = await barbeariasRepo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const selecionados = barbearia.config.catalogo_servicos.filter(
    (s) => s.ativo && data.servicoIds.includes(s.id)
  );
  if (selecionados.length === 0) throw new Error("Selecione um serviço");

  const cliente = await clientesRepo.get(session.clienteId);
  const ultimaVisita = cliente?.ultima_visita
    ? new Date(cliente.ultima_visita)
    : null;

  const itens = selecionados.map((s) => {
    const { preco } = calcularPreco(s, ultimaVisita);
    return { id: s.id, nome: s.nome, preco, duracao_min: s.duracao_min };
  });
  const duracao = itens.reduce((a, i) => a + i.duracao_min, 0);
  const valorTotal = itens.reduce((a, i) => a + i.preco, 0);

  const inicio = new Date(`${data.data}T${data.horario}:00`);
  if (inicio.getTime() < Date.now()) throw new Error("Horário no passado");

  const fim = new Date(inicio.getTime() + duracao * 60 * 1000);

  const criado = await atRepo.criar({
    barbeiroId: data.barbeiroId,
    clienteId: session.clienteId,
    inicio,
    fim,
    servicos: itens,
    valorTotal,
    bloqueios: barbearia.config.bloqueios ?? [],
  });

  redirect(`/c/${data.slug}/meus-agendamentos`);
  return { id: criado.id };
}

export async function cancelarPeloCliente(
  slug: string,
  atendimentoId: string
) {
  const session = await requireClienteSession(slug);
  const atRepo = new AtendimentosRepo(session.barbeariaId);
  const at = await atRepo.get(atendimentoId);
  if (!at) throw new Error("Atendimento não encontrado");
  if (at.cliente_id !== session.clienteId)
    throw new Error("Você não pode cancelar este atendimento");
  if (at.status !== "agendado" && at.status !== "confirmado")
    throw new Error("Só dá pra cancelar agendamentos futuros");

  // Antecedência mínima: 2h antes do horário
  const duasHorasMs = 2 * 60 * 60 * 1000;
  if (new Date(at.inicio).getTime() - Date.now() < duasHorasMs) {
    throw new Error(
      "Cancele com pelo menos 2h de antecedência. Entre em contato com a barbearia."
    );
  }

  await atRepo.mudarStatus(atendimentoId, "cancelado");
  revalidatePath(`/c/${slug}/meus-agendamentos`);
}
