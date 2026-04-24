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

const tabelas = ["barbearias", "equipe", "clientes", "atendimentos"];

console.log("→ Verificando tabelas no Supabase...\n");
let ok = 0;
const faltando = [];
for (const t of tabelas) {
  const { error } = await sb.from(t).select("id").limit(1);
  if (error) {
    faltando.push(t);
    console.log(`  ✗ ${t}`);
  } else {
    ok++;
    console.log(`  ✓ ${t}`);
  }
}

console.log(`\n${ok}/${tabelas.length} tabelas encontradas.`);
if (faltando.length > 0) {
  console.log(`Faltando: ${faltando.join(", ")}`);
  console.log("Rode schema.sql no Supabase SQL Editor.");
  process.exit(1);
}
console.log("Banco pronto.");
