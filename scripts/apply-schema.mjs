/**
 * Aplica schema.sql via Supabase Management API.
 *
 * Precisa SUPABASE_ACCESS_TOKEN (Personal Access Token, começa com "sbp_").
 * Gere em: https://supabase.com/dashboard/account/tokens
 *
 * Uso:
 *   export SUPABASE_ACCESS_TOKEN=sbp_...
 *   node scripts/apply-schema.mjs
 */
import fs from "node:fs";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const pat = process.env.SUPABASE_ACCESS_TOKEN;

if (!url || !pat) {
  console.error("Faltam:");
  if (!url) console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  if (!pat) console.error("  - SUPABASE_ACCESS_TOKEN (PAT)");
  process.exit(1);
}

const projectRef = new URL(url).hostname.split(".")[0];
const schemaPath = path.resolve(new URL("../schema.sql", import.meta.url).pathname.replace(/^\//, ""));
const sql = fs.readFileSync(schemaPath, "utf8");

console.log(`→ Aplicando schema em projeto ${projectRef}...`);
console.log(`  ${sql.split("\n").length} linhas de SQL`);

const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  }
);

const body = await res.text();
if (!res.ok) {
  console.error(`\n✗ Falhou (status ${res.status}):`);
  console.error(body.slice(0, 500));
  process.exit(1);
}

console.log(`\n✓ Schema aplicado.`);
console.log("  Rode 'npm run check-db' pra confirmar as tabelas.");
