import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/infrastructure/database/client";
import { TABELAS } from "@/infrastructure/database/tabelas";
import { AtendimentosRepo } from "@/infrastructure/database/repositories/atendimentos.repo";
import { ClientesRepo } from "@/infrastructure/database/repositories/clientes.repo";
import { EquipeRepo } from "@/infrastructure/database/repositories/equipe.repo";
import { buscarBarbeariaPorId } from "@/infrastructure/database/repositories/barbearias.repo";
import { enviarEmail } from "@/lib/email/resend";
import { templateLembreteAgendamento } from "@/lib/email/templates/lembrete-agendamento";
import { env } from "@/lib/env";
import type { Atendimento } from "@/infrastructure/database/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cron diário (configurado em vercel.json) — envia lembretes por email para
 * todos os atendimentos confirmados/agendados nas próximas 24h que ainda
 * não receberam lembrete.
 *
 * Autorização: Vercel envia header `authorization: Bearer <CRON_SECRET>`
 * automaticamente. Em dev, qualquer um pode chamar (útil pra teste manual).
 */
export async function GET(req: Request) {
  if (env.NODE_ENV === "production") {
    const auth = req.headers.get("authorization");
    if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
    }
  }

  const agora = new Date();
  const limite = new Date(agora.getTime() + 24 * 60 * 60 * 1000);

  // Pega todos os atendimentos pendentes de lembrete em todas as barbearias
  const { data: atendimentos, error } = await supabaseAdmin
    .from(TABELAS.atendimentos)
    .select("*")
    .in("status", ["agendado", "confirmado"])
    .is("lembrete_enviado_em", null)
    .gte("inicio", agora.toISOString())
    .lte("inicio", limite.toISOString())
    .not("cliente_id", "is", null);

  if (error) {
    return NextResponse.json(
      { erro: error.message },
      { status: 500 }
    );
  }

  const lista = (atendimentos ?? []) as Atendimento[];
  const stats = { total: lista.length, enviados: 0, pulados: 0, erros: [] as string[] };

  // Agrupa por barbearia pra evitar refetch
  const porBarbearia = new Map<string, Atendimento[]>();
  for (const at of lista) {
    if (!porBarbearia.has(at.barbearia_id)) porBarbearia.set(at.barbearia_id, []);
    porBarbearia.get(at.barbearia_id)!.push(at);
  }

  for (const [barbeariaId, atts] of porBarbearia.entries()) {
    const barbearia = await buscarBarbeariaPorId(barbeariaId);
    if (!barbearia) continue;

    const clientesRepo = new ClientesRepo(barbeariaId);
    const equipeRepo = new EquipeRepo(barbeariaId);
    const atRepo = new AtendimentosRepo(barbeariaId);

    for (const at of atts) {
      try {
        if (!at.cliente_id) {
          stats.pulados++;
          continue;
        }
        const cliente = await clientesRepo.get(at.cliente_id);
        const emailDestino = cliente?.email ?? cliente?.auth_email ?? null;
        if (!cliente || !emailDestino) {
          stats.pulados++;
          continue;
        }
        const barbeiro = await equipeRepo.get(at.barbeiro_id);
        if (!barbeiro) {
          stats.pulados++;
          continue;
        }

        const { assunto, html } = templateLembreteAgendamento({
          clienteNome: cliente.nome,
          barbeariaNome: barbearia.nome,
          barbeariaSlug: barbearia.slug,
          barbeariaTelefone: barbearia.telefone,
          barbeariaCorPrimaria: barbearia.config.paleta?.primary,
          barbeariaLogoUrl: barbearia.logo_url,
          barbeiroNome: barbeiro.nome,
          servicos: at.servicos ?? [],
          inicio: at.inicio,
          appUrl: env.NEXT_PUBLIC_APP_URL,
        });

        const resultado = await enviarEmail({
          para: emailDestino,
          assunto,
          html,
        });

        if (resultado.ok) {
          await atRepo.marcarLembreteEnviado(at.id);
          stats.enviados++;
        } else {
          stats.erros.push(`${at.id}: ${resultado.erro}`);
        }
      } catch (e) {
        stats.erros.push(
          `${at.id}: ${e instanceof Error ? e.message : "erro"}`
        );
      }
    }
  }

  return NextResponse.json(stats);
}
