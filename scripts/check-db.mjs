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

const TABELAS = [
  "[SAAS][BARBEARIA][VICTOR][barbearias]",
  "[SAAS][BARBEARIA][VICTOR][equipe]",
  "[SAAS][BARBEARIA][VICTOR][clientes]",
  "[SAAS][BARBEARIA][VICTOR][atendimentos]",
];

console.log("→ Verificando tabelas no Supabase...\n");
let ok = 0;
const faltando = [];
for (const t of TABELAS) {
  const { error } = await sb.from(t).select("id").limit(1);
  if (error) {
    faltando.push(t);
    console.log(`  ✗ ${t}`);
  } else {
    ok++;
    console.log(`  ✓ ${t}`);
  }
}

console.log(`\n${ok}/${TABELAS.length} tabelas encontradas.`);
if (faltando.length > 0) {
  console.log(`Faltando:\n  - ${faltando.join("\n  - ")}`);
  console.log("\nRode schema.sql no Supabase SQL Editor.");
  process.exit(1);
}
console.log("Banco pronto.");
