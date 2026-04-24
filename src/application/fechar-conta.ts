"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { supabaseAdmin } from "@/infrastructure/database/client";
import { TABELAS } from "@/infrastructure/database/tabelas";
import { aplicarResgate } from "@/domain/cashback";
import { nivelAtual } from "@/domain/fpts";
import type { ProdutoVendido } from "@/infrastructure/database/types";

const produtoItemSchema = z.object({
  produtoId: z.string().uuid(),
  quantidade: z.coerce.number().int().min(1),
});

const schema = z.object({
  atendimentoId: z.string().uuid(),
  usarCashback: z.boolean(),
  formaPagamento: z.enum([
    "dinheiro",
    "pix",
    "cartao_debito",
    "cartao_credito",
    "fiado",
  ]),
  descontoExtra: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  produtos: z.array(produtoItemSchema).optional(),
});

export async function fecharConta(input: z.infer<typeof schema>) {
  const session = await requireSession();
  const data = schema.parse(input);

  const atRepo = new AtendimentosRepo(session.barbeariaId);
  const clientesRepo = new ClientesRepo(session.barbeariaId);
  const barbeariasRepo = new BarbeariasRepo(session.barbeariaId);

  const atendimento = await atRepo.get(data.atendimentoId);
  if (!atendimento) throw new Error("Atendimento não encontrado");
  if (atendimento.status === "realizado")
    throw new Error("Atendimento já foi fechado");

  const barbearia = await barbeariasRepo.get();
  if (!barbearia) throw new Error("Barbearia não encontrada");

  const valorServicos = Number.parseFloat(atendimento.valor_total ?? "0");

  // Nível + cashback do cliente
  let clienteNivelNumero: number | null = null;
  let cashbackFptsCliente = 0;
  if (atendimento.cliente_id) {
    const cliente = await clientesRepo.get(atendimento.cliente_id);
    cashbackFptsCliente = cliente?.cashback_fpts ?? 0;
    if (cliente) {
      const nv = nivelAtual(cliente.fpts, barbearia.config.niveis);
      clienteNivelNumero = nv?.numero ?? null;
    }
  }

  // Resolve produtos vendidos aplicando desconto por nível
  const produtosVendidos: ProdutoVendido[] = [];
  let valorProdutos = 0;
  const catalogo = new Map(
    barbearia.config.catalogo_produtos.map((p) => [p.id, p])
  );

  if (data.produtos && data.produtos.length > 0) {
    for (const item of data.produtos) {
      const p = catalogo.get(item.produtoId);
      if (!p) throw new Error(`Produto ${item.produtoId} não encontrado`);
      if (!p.ativo) throw new Error(`Produto "${p.nome}" inativo`);
      if (p.estoque < item.quantidade)
        throw new Error(`Estoque insuficiente de "${p.nome}"`);

      const precoBase = p.preco;
      let descPct = 0;
      if (clienteNivelNumero != null && p.desconto_por_nivel) {
        descPct = p.desconto_por_nivel[String(clienteNivelNumero)] ?? 0;
      }
      const precoFinal =
        descPct > 0
          ? Math.round(precoBase * (1 - descPct / 100) * 100) / 100
          : precoBase;

      produtosVendidos.push({
        id: p.id,
        nome: p.nome,
        preco: precoFinal,
        qtd: item.quantidade,
        desconto_pct: descPct || undefined,
      });
      valorProdutos += precoFinal * item.quantidade;
    }
  }

  const descontoExtra = data.descontoExtra
    ? Number.parseFloat(data.descontoExtra)
    : 0;
  const valorBase = valorServicos + valorProdutos;
  const valorComDesconto = Math.max(0, valorBase - descontoExtra);

  const resgate = aplicarResgate(
    valorComDesconto,
    data.usarCashback,
    cashbackFptsCliente,
    barbearia.config.cashback
  );

  // Atualiza o atendimento → realizado
  await supabaseAdmin
    .from(TABELAS.atendimentos)
    .update({
      status: "realizado",
      produtos: produtosVendidos.length > 0 ? produtosVendidos : null,
      valor_total: valorBase.toFixed(2),
      desconto: descontoExtra.toFixed(2),
      cashback_usado_reais: resgate.reaisAbatidos.toFixed(2),
      cashback_usado_fpts: resgate.fptsDebitados,
      valor_pago: resgate.valorFinal.toFixed(2),
      forma_pagamento: data.formaPagamento,
    })
    .eq("barbearia_id", session.barbeariaId)
    .eq("id", atendimento.id);

  // Debita estoque dos produtos vendidos (atualiza o catálogo JSONB da barbearia)
  if (produtosVendidos.length > 0) {
    const novoCatalogo = barbearia.config.catalogo_produtos.map((p) => {
      const vendido = produtosVendidos.find((v) => v.id === p.id);
      if (!vendido) return p;
      return { ...p, estoque: Math.max(0, p.estoque - vendido.qtd) };
    });
    await barbeariasRepo.salvarCatalogoProdutos(novoCatalogo);
  }

  // Cliente: FPTS pontualidade + débito do cashback usado + ultima_visita
  if (atendimento.cliente_id) {
    if (resgate.fptsDebitados > 0) {
      await clientesRepo.registrarEvento(
        atendimento.cliente_id,
        {
          tipo: "resgate",
          pontos: -resgate.fptsDebitados,
          descricao: `Abate de R$ ${resgate.reaisAbatidos.toFixed(2)}`,
        },
        barbearia.config.niveis
      );
    }
    const pontualidade = barbearia.config.fpts_regras.pontualidade ?? 0;
    if (pontualidade > 0) {
      await clientesRepo.registrarEvento(
        atendimento.cliente_id,
        {
          tipo: "pontualidade",
          pontos: pontualidade,
          descricao: "Compareceu ao atendimento",
        },
        barbearia.config.niveis
      );
    }
    await clientesRepo.atualizarUltimaVisita(
      atendimento.cliente_id,
      new Date(atendimento.inicio)
    );
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/produtos");
  revalidatePath("/clientes");
  revalidatePath("/financeiro/comissoes");

  return {
    valorBase,
    valorServicos,
    valorProdutos,
    descontoExtra,
    cashbackAbatido: resgate.reaisAbatidos,
    valorFinal: resgate.valorFinal,
  };
}
