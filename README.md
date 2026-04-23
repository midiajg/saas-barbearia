# Barbearia — Sistema de Gestão

Sistema SaaS para barbearias: agenda, CRM relacional, fidelidade com cashback (FPTS), precificação por frequência, PDV e financeiro.

**Escopo MVP (sem IA):** Dashboard · Agenda · Clientes · Barbeiros · Serviços · Fechar Conta (PDV) · Pagamentos · Horários · Feriados.

**Personas:**

1. `super_admin` — plataforma (`/admin`) · placeholder no MVP
2. `owner`, `manager`, `barber` — painel da barbearia (`/dashboard`)
3. `client` — portal público (`/c/[slug]`) · placeholder no MVP

---

## Stack

- **Next.js 16** (App Router, React 19, TypeScript estrito)
- **Tailwind v4** (paleta preta · `#45D4C0` destaque)
- **Supabase** (Postgres gerenciado — schema definido em `schema.sql`)
- **Auth própria** — login/senha (bcrypt) + JWT assinado com `jose` em cookie HTTP-only
- **Radix + shadcn primitives** · **Sonner** · **Lucide icons**
- **PWA** instalável em tablet (offline leve)
- **UaZapi** para lembretes via WhatsApp (Sprint 5)
- **Docker + Caddy** — padrão EasyPanel + registry local

---

## Setup

### 1. Supabase

Crie um projeto novo em [supabase.com](https://supabase.com). No SQL Editor, cole o conteúdo de `schema.sql` e execute uma vez.

> NÃO edite o schema fora desse arquivo. Toda alteração = nova revisão aqui + execução manual.

### 2. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
AUTH_SECRET="$(openssl rand -base64 32)"
```

### 3. Rodar local

```bash
npm install
npm run seed      # opcional: popula barbearia demo
npm run dev       # http://localhost:3000
```

Login demo após seed: `demo@barbearia.dev` / `demo12345`.

---

## Primeiros passos (dono da barbearia)

1. **Criar conta** em `/signup` — cria organização + usuário owner + horários padrão + níveis de fidelidade.
2. **Configurações → Horários**: ajuste funcionamento semanal + feriados.
3. **Gestão → Barbeiros**: cadastre quem atende (nome, cor no grid, % comissão).
4. **Gestão → Serviços**: catálogo com 3 preços por frequência (quinzenal, mensal, eventual).
5. **Agenda**: clique em um slot pra criar agendamento.
6. **Fechar Conta**: ao concluir o atendimento, clique no card do agendamento → escolha forma de pagamento → aplique cashback se cliente tiver saldo.

---

## Sistema de fidelidade (FPTS)

Cliente acumula FPTS por:

| Ação | Padrão |
|------|--------|
| Avaliar no Google | 500 |
| Indicar amigo | 500 |
| Seguir/engajar Instagram | 300 |
| Comparecer ao agendamento | 100 |
| Aniversário | 200 |

FPTS funcionam como **cashback**: o barbeiro vê o saldo em R$ na tela Fechar Conta e pode aplicar como desconto.

**Regra de conversão (configurável por barbearia):** `cashback_fpts_por_real`
- Default: 100 FPTS = R$ 1,00 (100 FPTS por real)
- Limite: até 30% do valor do serviço por atendimento

**Níveis (Bronze → Prata → Ouro)** baseiam-se no total histórico de FPTS. Resgate de cashback NÃO derruba o nível.

---

## Estrutura de pastas

```
src/
├── app/
│   ├── (dashboard)/            # Painel admin barbearia
│   │   ├── agenda/             # Grid barbeiros × hora
│   │   ├── clientes/           # CRM relacional + FPTS
│   │   ├── barbeiros/
│   │   ├── servicos/
│   │   ├── produtos/           # placeholder
│   │   ├── financeiro/
│   │   └── config/
│   ├── admin/                  # Super admin (placeholder V2)
│   ├── c/[slug]/               # Portal cliente (placeholder V2)
│   ├── login/  signup/         # Auth staff
│   └── api/
├── components/
│   ├── ui/                     # Primitives (Button, Input, Dialog...)
│   └── layout/                 # Sidebar, Topbar
├── domain/
│   ├── precificacao.ts         # Pure function preço por frequência
│   ├── fpts.ts                 # Níveis, próximo nível
│   └── cashback.ts             # FPTS → reais, abate máximo
├── application/
│   └── fechar-conta.ts         # Orquestra PDV
├── infrastructure/
│   └── database/
│       ├── client.ts           # Supabase admin client
│       ├── schema.ts           # Re-export types
│       ├── types.ts            # Tipos TS espelhando schema.sql
│       └── repositories/       # Um arquivo por agregado, tenant-scoped
├── lib/
│   ├── auth/                   # bcrypt, JWT, sessão
│   └── utils.ts
└── middleware.ts               # Roteia por persona (super_admin / staff / client)
```

---

## Princípios arquiteturais

- **Multi-tenant via camada de aplicação**: todo repo recebe `orgId` obrigatório no construtor. Query obrigatoriamente filtra por `org_id`. Sem RLS no MVP.
- **Precificação derivada**: nunca persistir preço final do serviço. `calcularPreco()` recebe `ultimaVisita` e retorna `{ preco, frequencia }`.
- **FPTS como log de eventos**: `fpts_eventos` é append-only (inclusive resgates com pontos negativos, tipo='resgate'). Snapshot em `clientes.fpts` + `clientes.cashback_fpts` pra query rápida.
- **Nunca sobrescrever edição manual do cliente**: status/notas/dados pessoais editados pelo barbeiro são sagrados.
- **Conventional Commits em português**: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`.
- **Timezone `America/Sao_Paulo`** em todo código; Docker roda UTC, compensar.

---

## Deploy (Vercel)

1. `vercel link` conecta a pasta ao projeto no dashboard.
2. Adicione as variáveis de ambiente em **Project → Settings → Environment Variables** (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` (ex: `https://saas-barbearia.vercel.app`)
   - `AUTH_COOKIE_NAME=barbearia_session` (opcional)
3. `git push origin main` — deploy automático via Git integration.
4. Região sugerida: `gru1` (São Paulo) — configurado em `vercel.json`.

### Deploy alternativo (Docker/EasyPanel)

Mantido pra fallback. `Dockerfile` + `Caddyfile` + `scripts/deploy.sh` prontos, mas o setup padrão é Vercel.

---

## Roadmap pós-MVP

- **Sprint 5**: WhatsApp (lembretes + aniversário + inativos) · Produtos · Comissões · Relatórios
- **Sprint 6**: Testes E2E · Importação CSV · Piloto
- **V2**: Botão IA (sugestões baseadas em notas + histórico) · Autoagendamento público em `/c/[slug]` · Bot WhatsApp · Painel super admin completo · Visão restrita do barbeiro (auth role=barber)
