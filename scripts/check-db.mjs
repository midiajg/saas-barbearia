import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tabelasEsperadas = [
  "organizations",
  "users",
  "barbeiros",
  "servicos",
  "barbeiro_servicos",
  "produtos",
  "niveis",
  "clientes",
  "cliente_notas",
  "agendamentos",
  "pagamentos",
  "fpts_eventos",
  "horarios",
  "feriados",
  "cashback_resgates",
  "platform_admins",
];

console.log("→ Verificando tabelas no Supabase...\n");
let ok = 0;
let faltando = [];

for (const t of tabelasEsperadas) {
  const { error } = await sb.from(t).select("id").limit(1);
  if (error) {
    if (error.code === "42P01" || /does not exist|could not find/i.test(error.message)) {
      faltando.push(t);
      console.log(`  ✗ ${t} — não existe`);
    } else {
      console.log(`  ? ${t} — erro: ${error.message}`);
      faltando.push(t);
    }
  } else {
    ok++;
    console.log(`  ✓ ${t}`);
  }
}

console.log(`\n${ok}/${tabelasEsperadas.length} tabelas encontradas.`);
if (faltando.length > 0) {
  console.log(`\nFaltando: ${faltando.join(", ")}`);
  console.log("\nRode schema.sql no Supabase SQL Editor pra criar as que faltam.");
  process.exit(1);
}
console.log("\nBanco pronto. Pode rodar npm run dev.");
