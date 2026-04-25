# 📋 Próxima sessão — handoff pro próximo Claude

**Status atual**: 30+ rotas, build verde, deployado no Vercel via push automático.

## ✅ O que já está feito (catálogo completo)

### Staff (`/dashboard`, `/agenda`, etc)
- Login/signup da equipe (dono | gerente | barbeiro)
- Dashboard com KPIs
- Agenda dia-a-dia E semanal (`/agenda` e `/agenda/semana`)
- Cliente card mockup PDF (verde escuro, ícones, FPTS, estrelas, dialog gold)
- Marcar no-show debita FPTS automaticamente
- Cancelar/mudar status pelo card
- Fechar conta com cashback + produtos + desconto por nível
- CRUD Clientes, Equipe, Serviços, Produtos
- Drawer cliente: barra de progresso pro próximo nível, botões dar FPTS (Google/Indicação/Instagram/Aniversário/Ajuste)
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

### Portal Cliente (`/c/[slug]`)
- Home pública, cadastro, login
- Autoagendamento 5 passos (barbeiro → serviços → dia → hora → confirmar)
- Cancelar agendamento (mín 2h de antecedência)
- "Meus agendamentos" com saldo FPTS + link de indicação `?ref=clienteId`
- Cookies separados (cliente vs equipe — pode estar logado em ambos)

### Arquitetura
- 4 tabelas: `[SAAS][BARBEARIA][VICTOR][barbearias|equipe|clientes|atendimentos]`
- Configs (horários, níveis, FPTS regras, cashback, catálogos, despesas, bloqueios, fila, caixa, paleta) tudo em JSONB em `barbearias.config`
- `clientes.eventos_fpts` é array JSONB (log append-only)
- `auth_email` + `auth_senha_hash` em `clientes` pra portal

---

## 🚧 O QUE FALTA (em ordem de impacto)

### 🔴 ALTA PRIORIDADE — pega valor comercial real

#### 1. **Pacotes / Mensalidade do cliente final**
**Problema**: barbearias premium vendem "5 cortes por R$200" ou "Cabelo todo dia 15 por R$150/mês". Hoje não tem.

**Implementação sugerida**:
- Adicionar em `BarbeariaConfig`:
  ```ts
  pacotes?: {
    id: string;
    nome: string;
    preco: number;
    quantidade?: number; // X cortes
    recorrente?: boolean; // mensalidade
    duracao_dias?: number;
    servicos_inclusos: string[]; // catalogo_servicos.id
  }[]
  ```
- Adicionar em `Cliente`:
  ```ts
  pacote_ativo?: {
    pacote_id: string;
    inicio: string;
    fim: string;
    usos_restantes: number;
  }
  ```
- Páginas: `/produtos/pacotes` (CRUD admin), portal cliente vê pacote ativo + desconto automático no agendamento
- Em `fechar-conta.ts`: se cliente tem `pacote_ativo` válido cobrindo aquele serviço, debita uso e zera valor
- Estimativa: 3-4h

#### 2. **Lembrete por email** (substitui WhatsApp temporariamente)
**Por que**: principal causa de no-show é cliente esquecer.

**Implementação sugerida**:
- Usar [Resend](https://resend.com) (free tier 100 emails/dia, sem cartão)
- Adicionar `RESEND_API_KEY` no env
- Cron Vercel `/api/cron/lembretes-email` rodando 1x/dia (Hobby tier permite)
- Pra cada agendamento confirmado nas próximas 24h sem lembrete enviado, manda email
- Marcar `lembrete_enviado_em` no atendimento (campo novo)
- Estimativa: 2h

#### 3. **Marcar manualmente "agendamento confirmado"**
**Problema**: hoje status só vai pra realizado/no_show via UI. Faltam confirmação manual e em-atendimento.

**Implementação**: adicionar 2 botões no cliente card dialog ("Confirmar presença" e "Em atendimento"). Trivial. **30min**.

---

### 🟡 MÉDIA PRIORIDADE — destrava recorrente

#### 4. **PIX / Stripe / Mercado Pago**
**Recomendação**: começar com **Mercado Pago Checkout Pro** (PIX + cartão BR).

**Implementação**:
- Conta Mercado Pago + access token sandbox
- Endpoint `/api/pagamentos/criar-preference` cria preference, retorna init_point
- Webhook `/api/pagamentos/webhook` recebe notificações, atualiza atendimento
- No portal cliente: "Pagar antes" como opção
- Estimativa: 4-6h (com testes sandbox)

#### 5. **NFE / Cupom fiscal**
**Recomendação**: [NFE.io](https://nfe.io) — provedor brasileiro, API REST, R$0,40/NFSe.

**Implementação**:
- Conta NFE.io + certificado digital A1 da barbearia
- Endpoint `/api/nfse/emitir` chama API NFE.io com dados do atendimento realizado
- Salva URL do PDF da NFSe no atendimento (`nfse_url`)
- Botão "Emitir NF" no card de atendimento realizado
- Estimativa: 4h (sandbox NFE.io é simples)

#### 6. **Onboarding wizard pós-signup**
**Problema**: dono novo cai num dashboard vazio.

**Implementação**: detectar se barbearia tem zero serviços/equipe/cliente e mostrar checklist passo-a-passo na home: "1. Cadastre 1 serviço → 2. Adicione barbeiros → 3. Confira horários". Estimativa: 2h.

---

### 🟢 BAIXA PRIORIDADE — engenharia

#### 7. **Testes E2E (Playwright)**
**Implementação**: `npm i -D @playwright/test`, criar 5 spec essenciais:
- Login dono, criar cliente, agendar, fechar conta
- Login portal cliente, cadastro, autoagendar
- Cancelar com antecedência ok / antecedência ruim
- No-show debita FPTS
- Upload de foto

Estimativa: 6h.

#### 8. **Migrations versionadas**
**Recomendação**: Drizzle Kit. Cria pasta `drizzle/migrations` com SQL versionado.
- `npm i drizzle-kit drizzle-orm`
- `drizzle.config.ts` apontando pra Supabase
- Reescrever `schema.sql` como `drizzle/schema.ts` (mantém os colchetes via `pgTable("[SAAS]...", ...)`)
- `npx drizzle-kit generate` gera SQL versionado
- Estimativa: 3h.

#### 9. **Multi-filial / rede**
**Problema**: dono de rede precisa 1 login pra N barbearias.

**Implementação**:
- Adicionar tabela vincular `equipe ↔ barbearias` (many-to-many) — **mas isso é nova tabela**
- OU: dono tem múltiplas linhas em `equipe`, switcher no topbar
- Painel `/admin` mostra consolidado das filiais
- Estimativa: 1 dia.

#### 10. **Stripe Subscription do tenant** (você cobrar do dono)
**Implementação**: Stripe Billing, webhook ativa/desativa `barbearias.plano`. Bloqueia acesso quando trial expira ou inadimplente. Estimativa: 1 dia.

---

## 🛠️ Como continuar

### Setup pro próximo Claude:
```bash
cd C:/Users/Joao\ Gabriel/claude-project/barbearia-sistema
git pull
npm install
npm run check-db   # valida 4/4 tabelas
npm run dev        # http://localhost:3000
```

### Convenções importantes:
- **Tabelas com colchetes**: SEMPRE usar a constante `TABELAS` de `src/infrastructure/database/tabelas.ts`. Nunca string literal.
- **Multi-tenant**: todo repo tem `barbeariaId` no construtor, todo query filtra por `barbearia_id`.
- **JSONB tudo**: NÃO criar tabelas novas sem antes tentar JSONB em `barbearias.config` ou `clientes`.
- **Server actions**: usar `"use server"`, validar com zod, chamar `revalidatePath`. Sem `redirect()` dentro de try/catch (Next throw).
- **Types/JSONB**: tipos em `src/infrastructure/database/types.ts`. JSONB shapes ficam em refs declaradas na mesma file.
- **Auth dual**: `requireSession()` = staff, `requireClienteSession(slug)` = cliente. Cookies separados (`barbearia_staff_session` e `barbearia_cliente_session`).
- **Conventional Commits português**: `feat:`, `fix:`, `chore:`, etc.
- **Build verde antes de commitar**: `npx tsc --noEmit` zero erros, `npm run build` OK.

### Arquivos chave:
- `schema.sql` — fonte da verdade do DB
- `src/infrastructure/database/tabelas.ts` — nomes
- `src/infrastructure/database/types.ts` — todos os tipos
- `src/infrastructure/database/repositories/*` — 4 repos
- `src/lib/auth/{jwt,session,password}.ts` — auth
- `src/proxy.ts` — middleware roteamento

### Variáveis de ambiente Vercel:
```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
AUTH_SECRET
AUTH_COOKIE_NAME (default: barbearia_staff_session)
AUTH_COOKIE_CLIENTE (default: barbearia_cliente_session)
```
**NÃO** configure `TZ` na Vercel — é reservada. O código fixa `America/Sao_Paulo`.

### Bucket Supabase:
- `SAAS-BARBEARIA-FOTOS` — público — pra upload de fotos.

### Demo:
- Dono: `demo@barbearia.dev` / `demo12345`
- Barbeiros: `anderson@barbearia.dev` (ou diego/fábio/leone) / `barbeiro123`

---

## 🎯 Recomendação de ordem

Pra fechar piloto 100% pro Victor:
1. **Lembrete por email** (#2) — destrava o pitch "menos no-show"
2. **Pacotes** (#1) — destrava ticket maior
3. **Confirmar presença** (#3) — fecha fluxo da agenda
4. **Onboarding wizard** (#6) — destrava self-service de novos donos

Pra começar a vender:
5. **Mercado Pago** (#4) — pagamento online
6. **NFE.io** (#5) — fiscal

Pra escalar:
7. **Multi-filial** (#9)
8. **Stripe Billing** (#10)
9. **Testes E2E** (#7)

---

Última atualização: sessão de Claude do dia [SESSÃO ATUAL]
