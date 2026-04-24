"use server";

import { redirect } from "next/navigation";
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
  });

  redirect(`/c/${data.slug}/meus-agendamentos`);
  return { id: criado.id };
}
