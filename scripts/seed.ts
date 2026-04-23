/**
 * Seed de desenvolvimento.
 *
 * Uso:
 *   npm run seed
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

function logPostgrestErr(label: string, err: unknown) {
  const e = err as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };
  console.error(`  ✗ ${label}`);
  console.error(`    message: ${e?.message ?? "(sem message)"}`);
  console.error(`    code:    ${e?.code ?? "(sem code)"}`);
  console.error(`    details: ${e?.details ?? "(sem details)"}`);
  console.error(`    hint:    ${e?.hint ?? "(sem hint)"}`);
}

async function step<T>(label: string, fn: () => Promise<T>): Promise<T> {
  process.stdout.write(`→ ${label}... `);
  try {
    const out = await fn();
    console.log("ok");
    return out;
  } catch (err) {
    console.log("FALHOU");
    logPostgrestErr(label, err);
    throw err;
  }
}

async function main() {
  const { data: orgExist, error: lookupErr } = await sb
    .from("organizations")
    .select("id")
    .eq("slug", "barbearia-demo")
    .maybeSingle();
  if (lookupErr) {
    logPostgrestErr("lookup org demo", lookupErr);
    throw lookupErr;
  }

  if (orgExist) {
    await step("remove barbearia-demo anterior", async () => {
      const { error } = await sb
        .from("organizations")
        .delete()
        .eq("id", orgExist.id);
      if (error) throw error;
    });
  }

  const org = await step("cria barbearia demo", async () => {
    const { data, error } = await sb
      .from("organizations")
      .insert({
        nome: "Barbearia Demo",
        slug: "barbearia-demo",
        cashback_fpts_por_real: 100,
        cashback_max_pct_por_servico: 30,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  });

  await step("cria owner", async () => {
    const hash = await bcrypt.hash("demo12345", 12);
    const { error } = await sb.from("users").insert({
      org_id: org.id,
      email: "demo@barbearia.dev",
      password_hash: hash,
      nome: "João (demo)",
      role: "owner",
    });
    if (error) throw error;
  });

  await step("cria horários", async () => {
    const { error } = await sb.from("horarios").insert([
      { org_id: org.id, dia_semana: 0, abertura: "09:00", fechamento: "14:00", ativo: false },
      { org_id: org.id, dia_semana: 1, abertura: "09:00", fechamento: "20:00", ativo: true },
      { org_id: org.id, dia_semana: 2, abertura: "09:00", fechamento: "20:00", ativo: true },
      { org_id: org.id, dia_semana: 3, abertura: "09:00", fechamento: "20:00", ativo: true },
      { org_id: org.id, dia_semana: 4, abertura: "09:00", fechamento: "20:00", ativo: true },
      { org_id: org.id, dia_semana: 5, abertura: "09:00", fechamento: "21:00", ativo: true },
      { org_id: org.id, dia_semana: 6, abertura: "08:00", fechamento: "18:00", ativo: true },
    ]);
    if (error) throw error;
  });

  const niveis = await step("cria níveis", async () => {
    const { data, error } = await sb
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
    if (error) throw error;
    return data;
  });

  const barbeiros = await step("cria barbeiros", async () => {
    const { data, error } = await sb
      .from("barbeiros")
      .insert([
        { org_id: org.id, nome: "Anderson", cor: "#45D4C0", percentual_comissao: 50 },
        { org_id: org.id, nome: "Diego", cor: "#E07A5F", percentual_comissao: 50 },
        { org_id: org.id, nome: "Fábio", cor: "#F2CC8F", percentual_comissao: 50 },
        { org_id: org.id, nome: "Leone", cor: "#81B29A", percentual_comissao: 50 },
      ])
      .select();
    if (error) throw error;
    return data;
  });

  const servicos = await step("cria serviços", async () => {
    const { data, error } = await sb
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
    if (error) throw error;
    return data;
  });

  if (!barbeiros || !servicos || !niveis) throw new Error("seed: retorno vazio");

  await step("vincula barbeiros × serviços", async () => {
    const bs = barbeiros.flatMap((b) =>
      servicos.map((s) => ({ barbeiro_id: b.id, servico_id: s.id }))
    );
    const { error } = await sb.from("barbeiro_servicos").insert(bs);
    if (error) throw error;
  });

  const clientesRows = await step("cria clientes", async () => {
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
    const { data, error } = await sb.from("clientes").insert(clientes).select();
    if (error) throw error;
    return data;
  });

  if (!clientesRows) throw new Error("seed: clientes vazios");

  await step("cria agendamentos da semana", async () => {
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
    const { error } = await sb.from("agendamentos").insert(agendamentos);
    if (error) throw error;
  });

  console.log("\n✓ Seed concluído.");
  console.log("  Login owner: demo@barbearia.dev / demo12345");
  console.log("  Portal cliente: /c/barbearia-demo/signup");
}

main().catch((err) => {
  console.error("\nSEED ABORTADO.");
  if (err?.message) console.error("  message:", err.message);
  process.exit(1);
});
