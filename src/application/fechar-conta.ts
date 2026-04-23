"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffSession } from "@/lib/auth/session";
import { AgendamentosRepo } from "@/infrastructure/database/repositories/agendamentos.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { OrganizationRepo } from "@/infrastructure/database/repositories/organization.repo";
import { PagamentosRepo } from "@/infrastructure/database/repositories/pagamentos.repo";
import { supabaseAdmin } from "@/infrastructure/database/client";
import { aplicarResgate } from "@/domain/cashback";

const schema = z.object({
  agendamentoId: z.string().uuid(),
  usarCashback: z.boolean(),
  formaPagamento: z.enum([
    "dinheiro",
    "pix",
    "cartao_debito",
    "cartao_credito",
    "fiado",
  ]),
  descontoExtra: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export async function fecharConta(input: z.infer<typeof schema>) {
  const session = await requireStaffSession();
  const data = schema.parse(input);

  const agRepo = new AgendamentosRepo(session.orgId);
  const clientesRepo = new ClientesRepo(session.orgId);
  const orgRepo = new OrganizationRepo(session.orgId);
  const pagamentosRepo = new PagamentosRepo(session.orgId);

  const agendamento = await agRepo.get(data.agendamentoId);
  if (!agendamento) throw new Error("Agendamento não encontrado");
  if (agendamento.status === "realizado")
    throw new Error("Agendamento já foi fechado");

  const org = await orgRepo.get();
  if (!org) throw new Error("Organização não encontrada");

  const valorBase = Number.parseFloat(agendamento.valor_total ?? "0");
  const descontoExtra = data.descontoExtra
    ? Number.parseFloat(data.descontoExtra)
    : 0;
  const valorComDescontoExtra = Math.max(0, valorBase - descontoExtra);

  let cashbackFptsCliente = 0;
  if (agendamento.cliente_id) {
    const cliente = await clientesRepo.get(agendamento.cliente_id);
    cashbackFptsCliente = cliente?.cashback_fpts ?? 0;
  }

  const resgate = aplicarResgate(
    valorComDescontoExtra,
    data.usarCashback,
    cashbackFptsCliente,
    {
      fptsPorReal: org.cashback_fpts_por_real,
      maxPctPorServico: org.cashback_max_pct_por_servico,
    }
  );

  // Atualiza agendamento → realizado
  await supabaseAdmin
    .from("agendamentos")
    .update({
      status: "realizado",
      desconto: descontoExtra.toFixed(2),
      cashback_usado_reais: resgate.reaisAbatidos.toFixed(2),
      cashback_usado_fpts: resgate.fptsDebitados,
      valor_pago: resgate.valorFinal.toFixed(2),
      forma_pagamento: data.formaPagamento,
    })
    .eq("org_id", session.orgId)
    .eq("id", agendamento.id);

  // Registra pagamento
  if (resgate.valorFinal > 0) {
    await pagamentosRepo.criar({
      agendamentoId: agendamento.id,
      valor: resgate.valorFinal.toFixed(2),
      forma: data.formaPagamento,
    });
  }

  // Cliente: FPTS pontualidade + debita cashback resgatado + atualiza ultima_visita
  if (agendamento.cliente_id) {
    if (resgate.fptsDebitados > 0) {
      await clientesRepo.addFptsEvento({
        clienteId: agendamento.cliente_id,
        tipo: "resgate",
        pontos: -resgate.fptsDebitados,
        descricao: `Abatimento de R$ ${resgate.reaisAbatidos.toFixed(2)}`,
      });
      await supabaseAdmin.from("cashback_resgates").insert({
        org_id: session.orgId,
        cliente_id: agendamento.cliente_id,
        agendamento_id: agendamento.id,
        fpts_debitados: resgate.fptsDebitados,
        reais_abatidos: resgate.reaisAbatidos.toFixed(2),
      });
    }

    const pontualidadePts = org.fpts_regras.pontualidade ?? 100;
    if (pontualidadePts > 0) {
      await clientesRepo.addFptsEvento({
        clienteId: agendamento.cliente_id,
        tipo: "pontualidade",
        pontos: pontualidadePts,
        descricao: "Compareceu ao agendamento",
      });
    }

    await clientesRepo.atualizarUltimaVisita(
      agendamento.cliente_id,
      new Date(agendamento.inicio)
    );
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/financeiro/pagamentos");

  return {
    valorBase,
    descontoExtra,
    cashbackAbatido: resgate.reaisAbatidos,
    valorFinal: resgate.valorFinal,
  };
}
