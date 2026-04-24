/**
 * Seed de desenvolvimento. Popula 1 barbearia + dono + 4 barbeiros +
 * 6 serviços + produtos + 15 clientes + atendimentos da semana.
 *
 * Uso: npm run seed
 */
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function logErr(label: string, err: unknown) {
  const e = err as { message?: string; code?: string; details?: string };
  console.error(`  ✗ ${label}`);
  console.error(`    ${e?.message ?? err}`);
  if (e?.code) console.error(`    code: ${e.code}`);
  if (e?.details) console.error(`    details: ${e.details}`);
}

async function step<T>(label: string, fn: () => Promise<T>): Promise<T> {
  process.stdout.write(`→ ${label}... `);
  try {
    const out = await fn();
    console.log("ok");
    return out;
  } catch (err) {
    console.log("FALHOU");
    logErr(label, err);
    throw err;
  }
}

const NIVEIS = [
  { numero: 1, nome: "Bronze", min_fpts: 0, beneficios: [] },
  {
    numero: 2,
    nome: "Prata",
    min_fpts: 500,
    beneficios: ["5% em produtos", "+10% FPTS por indicação"],
  },
  {
    numero: 3,
    nome: "Ouro",
    min_fpts: 1500,
    beneficios: [
      "15% em produtos",
      "+30% FPTS por indicação",
      "1 hidracorte/mês",
    ],
  },
];

const HORARIOS = [
  { dia_semana: 0, abertura: "09:00", fechamento: "14:00", ativo: false },
  { dia_semana: 1, abertura: "09:00", fechamento: "20:00", ativo: true },
  { dia_semana: 2, abertura: "09:00", fechamento: "20:00", ativo: true },
  { dia_semana: 3, abertura: "09:00", fechamento: "20:00", ativo: true },
  { dia_semana: 4, abertura: "09:00", fechamento: "20:00", ativo: true },
  { dia_semana: 5, abertura: "09:00", fechamento: "21:00", ativo: true },
  { dia_semana: 6, abertura: "08:00", fechamento: "18:00", ativo: true },
];

const SERVICOS = [
  {
    id: randomUUID(),
    nome: "Cabelo",
    duracao_min: 40,
    preco_quinzenal: 60,
    preco_mensal: 65,
    preco_eventual: 70,
    ativo: true,
  },
  {
    id: randomUUID(),
    nome: "Barba",
    duracao_min: 25,
    preco_quinzenal: 50,
    preco_mensal: 55,
    preco_eventual: 60,
    ativo: true,
  },
  {
    id: randomUUID(),
    nome: "Cabelo e Barba",
    duracao_min: 60,
    preco_quinzenal: 100,
    preco_mensal: 105,
    preco_eventual: 110,
    ativo: true,
  },
  {
    id: randomUUID(),
    nome: "Hidracorte",
    duracao_min: 45,
    preco_quinzenal: 80,
    preco_mensal: 85,
    preco_eventual: 90,
    ativo: true,
  },
  {
    id: randomUUID(),
    nome: "Sobrancelha",
    duracao_min: 15,
    preco_quinzenal: 20,
    preco_mensal: 22,
    preco_eventual: 25,
    ativo: true,
  },
];

const PRODUTOS = [
  {
    id: randomUUID(),
    nome: "Pomada modeladora",
    descricao: "Fixação forte, acabamento fosco",
    preco: 45,
    estoque: 20,
    desconto_por_nivel: { "2": 5, "3": 15 },
    ativo: true,
  },
  {
    id: randomUUID(),
    nome: "Óleo de barba",
    descricao: "Hidratação diária",
    preco: 38,
    estoque: 15,
    desconto_por_nivel: { "2": 5, "3": 15 },
    ativo: true,
  },
];

async function main() {
  const { data: existente } = await sb
    .from("barbearias")
    .select("id")
    .eq("slug", "barbearia-demo")
    .maybeSingle();
  if (existente) {
    await step("remove demo anterior", async () => {
      const { error } = await sb
        .from("barbearias")
        .delete()
        .eq("id", existente.id);
      if (error) throw error;
    });
  }

  const barbearia = await step("cria barbearia demo", async () => {
    const { data, error } = await sb
      .from("barbearias")
      .insert({
        nome: "Barbearia Demo",
        slug: "barbearia-demo",
        telefone: "(21) 99999-0000",
        config: {
          horarios: HORARIOS,
          feriados: [],
          niveis: NIVEIS,
          fpts_regras: {
            google: 500,
            indicacao: 500,
            instagram: 300,
            pontualidade: 100,
            aniversario: 200,
          },
          cashback: { fpts_por_real: 100, max_pct: 30 },
          catalogo_servicos: SERVICOS,
          catalogo_produtos: PRODUTOS,
          whatsapp: { token: null, instancia: null },
        },
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  });

  await step("cria dono", async () => {
    const hash = await bcrypt.hash("demo12345", 12);
    const { error } = await sb.from("equipe").insert({
      barbearia_id: barbearia.id,
      nome: "João (dono)",
      email: "demo@barbearia.dev",
      senha_hash: hash,
      cargo: "dono",
      cor: "#45D4C0",
      comissao_pct: 0,
    });
    if (error) throw error;
  });

  const barbeiros = await step("cria barbeiros", async () => {
    const equipe = [
      { nome: "Anderson", cor: "#45D4C0" },
      { nome: "Diego", cor: "#E07A5F" },
      { nome: "Fábio", cor: "#F2CC8F" },
      { nome: "Leone", cor: "#81B29A" },
    ];
    const hash = await bcrypt.hash("barbeiro123", 12);
    const rows = equipe.map((e, i) => ({
      barbearia_id: barbearia.id,
      nome: e.nome,
      email: `${e.nome.toLowerCase()}@barbearia.dev`,
      senha_hash: hash,
      cargo: "barbeiro",
      cor: e.cor,
      comissao_pct: 50,
    }));
    const { data, error } = await sb.from("equipe").insert(rows).select();
    if (error) throw error;
    return data;
  });

  const clientes = await step("cria clientes", async () => {
    const nomes = [
      "Pedro Henrique", "Matheus Cunha", "Bruno Eyer", "Ivan Ferreira",
      "Felipe Layton", "Evandro Cresc", "Guilherme Silva", "Estéfano Esteves",
      "João Gabriel", "Telber Pessanha", "Rodrigo Zé", "Eraldo Souza",
      "Iohan Trezze", "Maurício Pereira", "Pablo Pinmentel",
    ];
    const rows = nomes.map((nome, i) => ({
      barbearia_id: barbearia.id,
      nome,
      telefone: `(21) 9${String(10000000 + i * 1111).slice(0, 4)}-${String(i * 41).padStart(4, "0")}`,
      dados_pessoais: {
        endereco: i % 3 === 0 ? "Rua Nóbrega, 120" : undefined,
        aniversario:
          i % 4 === 0
            ? `199${i % 10}-0${(i % 9) + 1}-1${i % 10}`
            : undefined,
        profissao: i % 2 === 0 ? "Publicitário" : "Programador",
        hobby: i % 2 === 0 ? "Musculação" : "Futebol",
        filhos: i % 5 === 0 ? "Joaquim e Lara" : undefined,
      },
      fpts: i * 120,
      cashback_fpts: Math.floor(i * 120 * 0.6),
      eventos_fpts: [],
    }));
    const { data, error } = await sb.from("clientes").insert(rows).select();
    if (error) throw error;
    return data;
  });

  await step("cria atendimentos da semana", async () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const rows = [];
    for (let d = 0; d < 6; d++) {
      const dia = new Date(hoje);
      dia.setDate(hoje.getDate() + d - 2);
      for (let i = 0; i < 4; i++) {
        const barbeiro = barbeiros[i % barbeiros.length];
        const servico = SERVICOS[(d + i) % SERVICOS.length];
        const cliente = clientes[(d * 4 + i) % clientes.length];
        const hora = 9 + i * 2;
        const inicio = new Date(dia);
        inicio.setHours(hora, 0, 0, 0);
        const fim = new Date(inicio.getTime() + servico.duracao_min * 60 * 1000);
        const preco = servico.preco_eventual;
        const realizado = d < 2;
        rows.push({
          barbearia_id: barbearia.id,
          cliente_id: cliente.id,
          barbeiro_id: barbeiro.id,
          inicio: inicio.toISOString(),
          fim: fim.toISOString(),
          status: realizado ? "realizado" : "agendado",
          servicos: [
            {
              id: servico.id,
              nome: servico.nome,
              preco,
              duracao_min: servico.duracao_min,
            },
          ],
          valor_total: preco.toFixed(2),
          valor_pago: realizado ? preco.toFixed(2) : null,
          forma_pagamento: realizado ? "pix" : null,
        });
      }
    }
    const { error } = await sb.from("atendimentos").insert(rows);
    if (error) throw error;
  });

  console.log("\n✓ Seed concluído.");
  console.log("  Login dono: demo@barbearia.dev / demo12345");
  console.log("  Login barbeiro: anderson@barbearia.dev / barbeiro123");
}

main().catch((err) => {
  console.error("\nSEED ABORTADO.");
  if (err?.message) console.error("  message:", err.message);
  process.exit(1);
});
