"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { calcularPreco } from "@/domain/precificacao";
import type { StatusAtendimento } from "@/infrastructure/database/types";

const schema = z.object({
  barbeiroId: z.string().uuid(),
  clienteId: z.string().uuid().nullable(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horario: z.string().regex(/^\d{2}:\d{2}$/),
  servicoIds: z.array(z.string().uuid()).min(1),
});

export async function criarAtendimentoAction(
  input: z.infer<typeof schema>
): Promise<{ id: string }> {
  const session = await requireSession();
  const data = schema.parse(input);

  const barbeariasRepo = new BarbeariasRepo(session.barbeariaId);
  const atRepo = new AtendimentosRepo(session.barbeariaId);
  const clientesRepo = new ClientesRepo(session.barbeariaId);

  const barbearia = await barbeariasRepo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const selecionados = barbearia.config.catalogo_servicos.filter((s) =>
    data.servicoIds.includes(s.id)
  );
  if (selecionados.length === 0) throw new Error("Serviço inválido");

  let ultimaVisita: Date | null = null;
  if (data.clienteId) {
    const c = await clientesRepo.get(data.clienteId);
    ultimaVisita = c?.ultima_visita ? new Date(c.ultima_visita) : null;
  }

  const itens = selecionados.map((s) => {
    const { preco } = calcularPreco(s, ultimaVisita);
    return { id: s.id, nome: s.nome, preco, duracao_min: s.duracao_min };
  });

  const duracaoTotal = itens.reduce((acc, i) => acc + i.duracao_min, 0);
  const valorTotal = itens.reduce((acc, i) => acc + i.preco, 0);

  const inicio = new Date(`${data.data}T${data.horario}:00`);
  const fim = new Date(inicio.getTime() + duracaoTotal * 60 * 1000);

  const criado = await atRepo.criar({
    barbeiroId: data.barbeiroId,
    clienteId: data.clienteId ?? undefined,
    inicio,
    fim,
    servicos: itens,
    valorTotal,
    bloqueios: barbearia.config.bloqueios ?? [],
  });

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  return { id: criado.id };
}

export async function mudarStatusAction(
  id: string,
  status: StatusAtendimento
) {
  const session = await requireSession();
  const atRepo = new AtendimentosRepo(session.barbeariaId);
  const at = await atRepo.get(id);
  if (!at) throw new Error("Atendimento não encontrado");

  await atRepo.mudarStatus(id, status);

  // No-show: debita pontualidade do cliente como penalidade
  if (status === "no_show" && at.cliente_id) {
    const barbeariaRepo = new BarbeariasRepo(session.barbeariaId);
    const barbearia = await barbeariaRepo.get();
    if (barbearia) {
      const clientesRepo = new ClientesRepo(session.barbeariaId);
      const penalidade = barbearia.config.fpts_regras.pontualidade ?? 100;
      await clientesRepo.registrarEvento(
        at.cliente_id,
        {
          tipo: "ajuste",
          pontos: -penalidade,
          descricao: "Penalidade por não comparecer",
        },
        barbearia.config.niveis
      );
    }
  }

  revalidatePath("/agenda");
  revalidatePath("/clientes");
}

export async function cancelarAtendimentoAction(id: string) {
  return mudarStatusAction(id, "cancelado");
}
