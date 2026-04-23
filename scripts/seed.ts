/**
 * Seed de desenvolvimento.
 *
 * Uso:
 *   1. Rodar schema.sql no SQL Editor do Supabase (uma vez).
 *   2. Preencher .env com as chaves do Supabase.
 *   3. npx tsx scripts/seed.ts
 *
 * Popula: 1 barbearia + 1 owner + 4 barbeiros + 6 serviços + 15 clientes
 * + 20 agendamentos distribuídos na semana atual.
 */
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("→ Limpando dados existentes do seed (barbearia-demo)...");
  const { data: orgExist } = await sb
    .from("organizations")
    .select("id")
    .eq("slug", "barbearia-demo")
    .maybeSingle();
  if (orgExist) {
    await sb.from("organizations").delete().eq("id", orgExist.id);
  }

  console.log("→ Criando barbearia demo...");
  const { data: org, error: orgErr } = await sb
    .from("organizations")
    .insert({
      nome: "Barbearia Demo",
      slug: "barbearia-demo",
      cashback_fpts_por_real: 100,
      cashback_max_pct_por_servico: 30,
    })
    .select()
    .single();
  if (orgErr) throw orgErr;

  console.log("→ Criando dono (owner)...");
  const hash = await bcrypt.hash("demo12345", 12);
  await sb.from("users").insert({
    org_id: org.id,
    email: "demo@barbearia.dev",
    password_hash: hash,
    nome: "João (demo)",
    role: "owner",
  });

  console.log("→ Criando horários...");
  await sb.from("horarios").insert([
    { org_id: org.id, dia_semana: 0, abertura: "09:00", fechamento: "14:00", ativo: false },
    { org_id: org.id, dia_semana: 1, abertura: "09:00", fechamento: "20:00", ativo: true },
    { org_id: org.id, dia_semana: 2, abertura: "09:00", fechamento: "20:00", ativo: true },
    { org_id: org.id, dia_semana: 3, abertura: "09:00", fechamento: "20:00", ativo: true },
    { org_id: org.id, dia_semana: 4, abertura: "09:00", fechamento: "20:00", ativo: true },
    { org_id: org.id, dia_semana: 5, abertura: "09:00", fechamento: "21:00", ativo: true },
    { org_id: org.id, dia_semana: 6, abertura: "08:00", fechamento: "18:00", ativo: true },
  ]);

  console.log("→ Criando níveis...");
  const { data: niveis } = await sb
    .from("niveis")
    .insert([
      { org_id: org.id, numero: 1, nome: "Bronze", min_fpts: 0, beneficios: { descontoProdutos: 0 } },
      { org_id: org.id, numero: 2, nome: "Prata", min_fpts: 500, beneficios: { descontoProdutos: 5, bonusIndicacao: 10 } },
      {
        org_id: org.id,
        numero: 3,
        nome: "Ouro",
        min_fpts: 1500,
        beneficios: {
          descontoProdutos: 15,
          bonusIndicacao: 30,
          servicosGratis: ["1 hidracorte/nutricorte por mês"],
        },
      },
    ])
    .select();

  console.log("→ Criando barbeiros...");
  const { data: barbeiros } = await sb
    .from("barbeiros")
    .insert([
      { org_id: org.id, nome: "Anderson", cor: "#45D4C0", percentual_comissao: 50 },
      { org_id: org.id, nome: "Diego", cor: "#E07A5F", percentual_comissao: 50 },
      { org_id: org.id, nome: "Fábio", cor: "#F2CC8F", percentual_comissao: 50 },
      { org_id: org.id, nome: "Leone", cor: "#81B29A", percentual_comissao: 50 },
    ])
    .select();

  console.log("→ Criando serviços...");
  const { data: servicos } = await sb
    .from("servicos")
    .insert([
      { org_id: org.id, nome: "Cabelo", duracao_min: 40, preco_quinzenal: 60, preco_mensal: 65, preco_eventual: 70 },
      { org_id: org.id, nome: "Barba", duracao_min: 25, preco_quinzenal: 50, preco_mensal: 55, preco_eventual: 60 },
      { org_id: org.id, nome: "Cabelo e Barba", duracao_min: 60, preco_quinzenal: 100, preco_mensal: 105, preco_eventual: 110 },
      { org_id: org.id, nome: "Hidracorte", duracao_min: 45, preco_quinzenal: 80, preco_mensal: 85, preco_eventual: 90 },
      { org_id: org.id, nome: "Pigmentação", duracao_min: 50, preco_quinzenal: 90, preco_mensal: 95, preco_eventual: 100 },
      { org_id: org.id, nome: "Sobrancelha", duracao_min: 15, preco_quinzenal: 20, preco_mensal: 22, preco_eventual: 25 },
    ])
    .select();

  if (!barbeiros || !servicos || !niveis) throw new Error("seed falhou");

  // Cada barbeiro faz todos os serviços
  const bs = barbeiros.flatMap((b) =>
    servicos.map((s) => ({ barbeiro_id: b.id, servico_id: s.id }))
  );
  await sb.from("barbeiro_servicos").insert(bs);

  console.log("→ Criando clientes...");
  const nomes = [
    "Pedro Henrique", "Matheus Cunha", "Bruno Eyer", "Ivan Ferreira",
    "Felipe Layton", "Evandro Cresc", "Guilherme Silva", "Estéfano Esteves",
    "João Gabriel", "Telber Pessanha", "Rodrigo Zé", "Eraldo Souza",
    "Iohan Trezze", "Maurício Pereira", "Pablo Pinmentel",
  ];
  const clientes = nomes.map((nome, i) => ({
    org_id: org.id,
    nome,
    telefone: `(21) 9${String(10000000 + i * 1111).slice(0, 4)}-${String(i * 41).padStart(4, "0")}`,
    endereco: i % 3 === 0 ? "Rua Nóbrega, 120" : null,
    aniversario: i % 4 === 0 ? `199${i % 10}-0${(i % 9) + 1}-1${i % 10}` : null,
    profissao: i % 2 === 0 ? "Publicitário" : "Programador",
    hobby: i % 2 === 0 ? "Musculação" : "Futebol",
    fpts: i * 120,
    cashback_fpts: Math.floor(i * 120 * 0.6),
    nivel_id:
      i * 120 >= 1500
        ? niveis[2].id
        : i * 120 >= 500
          ? niveis[1].id
          : niveis[0].id,
  }));
  const { data: clientesRows } = await sb
    .from("clientes")
    .insert(clientes)
    .select();

  if (!clientesRows) throw new Error("seed clientes falhou");

  console.log("→ Criando agendamentos da semana...");
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const agendamentos = [];
  for (let d = 0; d < 6; d++) {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() + d - 2);
    for (let i = 0; i < 4; i++) {
      const barbeiro = barbeiros[i % barbeiros.length];
      const servico = servicos[(d + i) % servicos.length];
      const cliente = clientesRows[(d * 4 + i) % clientesRows.length];
      const hora = 9 + i * 2;
      const inicio = new Date(dia);
      inicio.setHours(hora, 0, 0, 0);
      const fim = new Date(inicio.getTime() + servico.duracao_min * 60 * 1000);
      const preco = Number.parseFloat(servico.preco_eventual);
      agendamentos.push({
        org_id: org.id,
        cliente_id: cliente.id,
        barbeiro_id: barbeiro.id,
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        status: d < 2 ? "realizado" : "agendado",
        servicos: [
          {
            servicoId: servico.id,
            nome: servico.nome,
            preco,
            duracaoMin: servico.duracao_min,
          },
        ],
        valor_total: preco.toFixed(2),
      });
    }
  }
  await sb.from("agendamentos").insert(agendamentos);

  console.log("✓ Seed concluído.");
  console.log("  Login: demo@barbearia.dev / demo12345");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
