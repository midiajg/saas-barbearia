# 📋 Próxima sessão — handoff pro próximo Claude

**Status atual**: 32 rotas, build verde, deployado no Vercel via push automático. Pacotes/mensalidade implementados. Lembrete por email pronto (precisa Resend key). Onboarding wizard no dashboard. Botões "Confirmar" e "Em atendimento" no card. Pass de responsividade aplicado em todas as telas.

## ✅ O que já está feito (catálogo completo)

### Staff (`/dashboard`, `/agenda`, etc)
- Login/signup da equipe (dono | gerente | barbeiro)
- Dashboard com KPIs + **wizard de onboarding** (detecta horários/serviços/equipe/clientes pendentes)
- Agenda dia-a-dia E semanal (`/agenda` e `/agenda/semana`)
- Cliente card mockup PDF (verde escuro, ícones, FPTS, estrelas, dialog gold)
- **Botões status no card**: Confirmar presença, Em atendimento, Marcar no-show
- Marcar no-show debita FPTS automaticamente
- Cancelar/mudar status pelo card
- Fechar conta com cashback + produtos + desconto por nível + **pacote ativo**
- CRUD Clientes, Equipe, Serviços, Produtos, **Pacotes**
- Drawer cliente: barra de progresso pro próximo nível, botões dar FPTS (Google/Indicação/Instagram/Aniversário/Ajuste), **vender/cancelar pacote**
- Bloqueios de horário (folga, almoço) — valida na criação
- Fila de espera (walk-in) na agenda
- Configs: FPTS regras, Níveis CRUD, Cashback, Horários, Feriados
- Despesas (CRUD + categorias + pago/aberto + KPIs)
- Caixa do dia (abrir, sangria, suprimento, fechar com diferença vs sistema, histórico 30 dias)
- Comissões com filtro + CSV
- Relatórios com charts (faturamento, top clientes/barbeiros, formas pgto, inativos)
- Upload foto: Supabase Storage bucket `SAAS-BARBEARIA-FOTOS`
- White-label: 8 cores preset + custom + logo
- Vercel Analytics
- **Sidebar mobile** com drawer overlay (hamburguer no topbar) — todas as rotas responsivas

### Portal Cliente (`/c/[slug]`)
- Home pública, cadastro, login (com `?ref=clienteId` pra indicação)
- Autoagendamento 5 passos (barbeiro → serviços → dia → hora → confirmar)
- Cancelar agendamento (mín 2h de antecedência)
- "Meus agendamentos" com saldo FPTS + link de indicação + **pacote ativo**
- Cookies separados (cliente vs equipe — pode estar logado em ambos)

### Lembrete por email (NOVO)
- Resend API + cron Vercel diário às 12h (`/api/cron/lembretes-email`)
- Para cada agendamento confirmado/agendado nas próximas 24h sem lembrete enviado, manda email
- Marca `lembrete_enviado_em` no atendimento
- Template HTML responsivo com cor primária da barbearia
- **Configurar em produção**: setar `RESEND_API_KEY` + `EMAIL_FROM` + `CRON_SECRET` no Vercel
- Sem `RESEND_API_KEY` o cron retorna erro mas não quebra produção

### Pacotes / Mensalidade (NOVO)
- CRUD em `/produtos/pacotes` (sidebar)
- Tipos: usos limitados (5 cortes) ou ilimitado, recorrente ou single, validade em dias
- Cobre TODOS os serviços (servicos_inclusos vazio) ou específicos
- Vender: drawer do cliente em `/clientes` → botão "Vender pacote"
- Aplica automático no fechar-conta: zera serviços cobertos, debita usos
- Quando esgota e não é recorrente, desativa
- Portal cliente vê pacote ativo em `/meus-agendamentos`

### Arquitetura
- 4 tabelas: `[SAAS][BARBEARIA][VICTOR][barbearias|equipe|clientes|atendimentos]`
- Configs (horários, níveis, FPTS regras, cashback, catálogos, despesas, bloqueios, fila, caixa, paleta, **pacotes**) tudo em JSONB em `barbearias.config`
- `clientes.eventos_fpts` é array JSONB (log append-only)
- `clientes.pacote_ativo` é JSONB (snapshot do pacote no momento da venda)
- `atendimentos.lembrete_enviado_em` timestamptz
- `auth_email` + `auth_senha_hash` em `clientes` pra portal

---

## 🚧 O QUE FALTA (em ordem de impacto)

### 🟡 MÉDIA PRIORIDADE — destrava recorrente

#### 1. **PIX / Stripe / Mercado Pago**
**Recomendação**: começar com **Mercado Pago Checkout Pro** (PIX + cartão BR).

**Implementação**:
- Conta Mercado Pago + access token sandbox
- Endpoint `/api/pagamentos/criar-preference` cria preference, retorna init_point
- Webhook `/api/pagamentos/webhook` recebe notificações, atualiza atendimento
- No portal cliente: "Pagar antes" como opção
- Estimativa: 4-6h (com testes sandbox)

#### 2. **NFE / Cupom fiscal**
**Recomendação**: [NFE.io](https://nfe.io) — provedor brasileiro, API REST, R$0,40/NFSe.

**Implementação**:
- Conta NFE.io + certificado digital A1 da barbearia
- Endpoint `/api/nfse/emitir` chama API NFE.io com dados do atendimento realizado
- Salva URL do PDF da NFSe no atendimento (`nfse_url`)
- Botão "Emitir NF" no card de atendimento realizado
- Estimativa: 4h (sandbox NFE.io é simples)

#### 3. **Pagamento recorrente do pacote (mensalidade automática)**
**Problema atual**: pacote recorrente é manual — barbearia precisa renovar quando vence. Pacote MVP ativa, debita usos, expira.

**Implementação**: integrar com Mercado Pago Subscriptions ou Asaas. Quando pacote `recorrente=true` é vendido, criar assinatura. Webhook renova/cancela automaticamente.

Estimativa: 6h

---

### 🟢 BAIXA PRIORIDADE — engenharia

#### 4. **Testes E2E (Playwright)**
**Implementação**: `npm i -D @playwright/test`, criar 5 spec essenciais:
- Login dono, criar cliente, agendar, fechar conta
- Login portal cliente, cadastro, autoagendar
- Cancelar com antecedência ok / antecedência ruim
- No-show debita FPTS
- Upload de foto + venda de pacote

Estimativa: 6h.

#### 5. **Migrations versionadas**
**Recomendação**: Drizzle Kit. Cria pasta `drizzle/migrations` com SQL versionado.
- `npm i drizzle-kit drizzle-orm`
- `drizzle.config.ts` apontando pra Supabase
- Reescrever `schema.sql` como `drizzle/schema.ts` (mantém os colchetes via `pgTable("[SAAS]...", ...)`)
- `npx drizzle-kit generate` gera SQL versionado
- Estimativa: 3h.

#### 6. **Multi-filial / rede**
**Problema**: dono de rede precisa 1 login pra N barbearias.

**Implementação**:
- Adicionar tabela vincular `equipe ↔ barbearias` (many-to-many) — **mas isso é nova tabela**
- OU: dono tem múltiplas linhas em `equipe`, switcher no topbar
- Painel `/admin` mostra consolidado das filiais
- Estimativa: 1 dia.

#### 7. **Stripe Subscription do tenant** (você cobrar do dono)
**Implementação**: Stripe Billing, webhook ativa/desativa `barbearias.plano`. Bloqueia acesso quando trial expira ou inadimplente. Estimativa: 1 dia.

#### 8. **Notificações WhatsApp** (substituir email)
**Implementação**: integrar UaZapi (a barbearia já tem WhatsApp configurado em `/config/whatsapp`). Endpoint `/api/cron/lembretes-whatsapp` similar ao email. Use mesmo `lembrete_enviado_em` ou criar `lembrete_whatsapp_enviado_em`. Estimativa: 2-3h.

---

## 🛠️ Como continuar

### Setup pro próximo Claude:
```bash
cd C:/Users/Joao\ Gabriel/claude-project/barbearia-sistema
git pull
npm install
npm run check-db   # valida 4/4 tabelas
npm run apply-schema   # se tiver mudanças de schema (idempotente)
npm run dev        # http://localhost:3000
```

### Variáveis de ambiente (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
AUTH_SECRET
AUTH_COOKIE_NAME (default: barbearia_staff_session)
AUTH_COOKIE_CLIENTE (default: barbearia_cliente_session)
RESEND_API_KEY (opcional — sem isso, lembrete não envia mas não quebra)
EMAIL_FROM (default: 'Barbearia <onboarding@resend.dev>')
CRON_SECRET (Vercel envia automaticamente no header authorization)
```
**NÃO** configure `TZ` na Vercel — é reservada. O código fixa `America/Sao_Paulo`.

### Convenções importantes:
- **Tabelas com colchetes**: SEMPRE usar a constante `TABELAS` de `src/infrastructure/database/tabelas.ts`. Nunca string literal.
- **Multi-tenant**: todo repo tem `barbeariaId` no construtor, todo query filtra por `barbearia_id`.
- **JSONB tudo**: NÃO criar tabelas novas sem antes tentar JSONB em `barbearias.config` ou `clientes`.
- **Server actions**: usar `"use server"`, validar com zod, chamar `revalidatePath`. Sem `redirect()` dentro de try/catch (Next throw).
- **Types/JSONB**: tipos em `src/infrastructure/database/types.ts`. JSONB shapes ficam em refs declaradas na mesma file.
- **Auth dual**: `requireSession()` = staff, `requireClienteSession(slug)` = cliente. Cookies separados (`barbearia_staff_session` e `barbearia_cliente_session`).
- **Conventional Commits português**: `feat:`, `fix:`, `chore:`, etc.
- **Build verde antes de commitar**: `npx tsc --noEmit` zero erros, `npm run build` OK.
- **Responsividade**: páginas usam padrão `flex-col gap-3 sm:flex-row sm:items-center sm:justify-between` em headers, `text-2xl sm:text-3xl` em h1, grids `grid-cols-1 sm:grid-cols-2 lg:grid-cols-N`.
- **Sidebar**: drawer no mobile via `DashboardShell` (`src/components/layout/dashboard-shell.tsx`) — qualquer item novo na sidebar funciona automático.

### Arquivos chave:
- `schema.sql` — fonte da verdade do DB (com migrações idempotentes via `add column if not exists`)
- `src/infrastructure/database/tabelas.ts` — nomes
- `src/infrastructure/database/types.ts` — todos os tipos
- `src/infrastructure/database/repositories/*` — 4 repos
- `src/lib/auth/{jwt,session,password}.ts` — auth
- `src/lib/email/{resend,templates/*}` — envio email
- `src/domain/pacotes.ts` — lógica de aplicação de pacote no fechar-conta
- `src/proxy.ts` — middleware roteamento
- `src/components/layout/dashboard-shell.tsx` — wrapper client com sidebar drawer mobile

### Bucket Supabase:
- `SAAS-BARBEARIA-FOTOS` — público — pra upload de fotos.

### Demo:
- Dono: `demo@barbearia.dev` / `demo12345`
- Barbeiros: `anderson@barbearia.dev` (ou diego/fábio/leone) / `barbeiro123`

---

## 🎯 Recomendação de ordem (próximas sessões)

Pra abrir captura de pagamento online:
1. **Mercado Pago checkout** (#1) — destrava cobrança no portal cliente
2. **Mensalidade recorrente** (#3) — destrava receita previsível

Pra fechar fiscal:
3. **NFE.io** (#2)

Pra escalar:
4. **WhatsApp lembretes** (#8) — taxa de abertura > email no BR
5. **Multi-filial** (#6)
6. **Stripe Billing tenant** (#7)
7. **Testes E2E** (#4)
8. **Drizzle migrations** (#5)

---

## 🧪 Testar manualmente o que foi feito hoje

### 1. Botões status no card
- Vá em `/agenda`, abra um agendamento
- Aparecem botões "✓ Confirmar" e "▶ Em atendimento" se status = agendado
- Em "confirmado" só aparece "Em atendimento"
- Em "em_atendimento" não aparece nenhum, mostra label "▶ Em atendimento agora"

### 2. Lembrete por email (precisa configurar Resend)
- Pegue key em https://resend.com (free 100/dia)
- Adicione no `.env.local`: `RESEND_API_KEY=re_xxxxx`
- Cliente cadastrado precisa ter email
- Crie agendamento confirmado para amanhã
- Chame `GET /api/cron/lembretes-email` (em dev funciona sem auth)
- Email deve chegar com cor primária da barbearia
- Refresh: campo `lembrete_enviado_em` preenchido

### 3. Pacotes
- Vá em `/produtos/pacotes` (item novo na sidebar)
- Crie um pacote: "5 cortes mensais" R$200, 5 usos, 30 dias, marque corte
- Vá em `/clientes`, abra um cliente
- Seção "Pacote" → "Vender pacote" → escolha → ativar
- Crie agendamento desse cliente com o serviço corte
- Feche a conta: serviço deve ficar zerado, contagem cai pra 4

### 4. Onboarding wizard
- Crie nova barbearia (logout + signup)
- Dashboard mostra checklist no topo:
  - Definir horários (link pra `/config/horarios`)
  - Cadastrar serviço (link pra `/serviços`)
  - Adicionar barbeiros
  - Cadastrar cliente
- Conforme completa, item fica riscado e barra avança
- Esconde sozinho quando essenciais (horários + serviços) feitos, ou clica no X

### 5. Responsividade mobile
- Abra `/dashboard` num celular ou DevTools mobile
- Sidebar deve estar ESCONDIDA, com botão hamburguer no topo
- Clica no hamburguer → drawer abre por cima com backdrop preto
- Clica fora ou navega → fecha
- Headers de todas as páginas com h1 menor no mobile
- KPIs em grade 2x2 no mobile, 4x1 no desktop
- Tabela de comissões scrolla horizontal no mobile

---

Última atualização: sessão de Claude do dia 2026-04-25 — implementou os 4 itens do handoff anterior + pass completo de responsividade.
