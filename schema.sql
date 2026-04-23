-- =====================================================================
-- Barbearia — Sistema de Gestão · Schema SQL (Supabase)
-- =====================================================================
-- Cole este arquivo no Supabase SQL Editor (uma vez por projeto novo).
-- NÃO altere o esquema fora deste arquivo. Toda mudança = nova revisão
-- aqui + execução manual no SQL Editor.
--
-- 4 personas:
--   1. super_admin (IAContável)        → tabela platform_admins
--   2. owner / manager / barber        → tabela users (vinculados a 1 org)
--   3. cliente (consumidor final)      → tabela clientes (auth opcional)
--
-- Multi-tenant: toda tabela referencia organizations(id).
-- Isolamento: feito na camada de aplicação. Sem RLS no MVP.
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------------------------------------------------
do $$ begin
  create type user_role as enum ('owner', 'manager', 'barber');
exception when duplicate_object then null; end $$;

do $$ begin
  create type agendamento_status as enum (
    'agendado','confirmado','em_atendimento','realizado','no_show','cancelado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type forma_pagamento as enum (
    'dinheiro','pix','cartao_debito','cartao_credito','fiado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type fpts_evento_tipo as enum (
    'google','indicacao','instagram','pontualidade','aniversario','resgate','ajuste_manual'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type plano_assinatura as enum ('trial','basico','profissional','rede');
exception when duplicate_object then null; end $$;

-- ---------- PLATFORM (super_admin) -----------------------------------

create table if not exists platform_admins (
  id             uuid primary key default uuid_generate_v4(),
  email          text not null unique,
  password_hash  text not null,
  nome           text not null,
  criado_em      timestamptz not null default now()
);

-- ---------- ORGANIZATIONS --------------------------------------------

create table if not exists organizations (
  id                           uuid primary key default uuid_generate_v4(),
  nome                         text not null,
  slug                         text not null unique,
  logo_url                     text,
  paleta                       jsonb,
  fuso_horario                 text not null default 'America/Sao_Paulo',
  plano                        plano_assinatura not null default 'trial',
  ativa                        boolean not null default true,
  -- Cashback: regra de conversão FPTS → Reais (ex: 100 FPTS = R$ 1,00)
  cashback_fpts_por_real       integer not null default 100,
  cashback_max_pct_por_servico integer not null default 30,
  fpts_regras                  jsonb not null default '{
    "google": 500,
    "indicacao": 500,
    "instagram": 300,
    "pontualidade": 100,
    "aniversario": 200
  }'::jsonb,
  criado_em                    timestamptz not null default now()
);

-- ---------- USERS (owner / manager / barber) -------------------------

create table if not exists users (
  id             uuid primary key default uuid_generate_v4(),
  org_id         uuid not null references organizations(id) on delete cascade,
  email          text not null,
  password_hash  text not null,
  nome           text not null,
  role           user_role not null default 'owner',
  criado_em      timestamptz not null default now()
);
create unique index if not exists users_email_unique on users(email);
create index if not exists users_org_idx on users(org_id);

-- ---------- BARBEIROS ------------------------------------------------

create table if not exists barbeiros (
  id                  uuid primary key default uuid_generate_v4(),
  org_id              uuid not null references organizations(id) on delete cascade,
  user_id             uuid references users(id) on delete set null,
  nome                text not null,
  foto_url            text,
  cor                 text not null default '#45D4C0',
  percentual_comissao numeric(5,2) not null default 50.00,
  ativo               boolean not null default true,
  criado_em           timestamptz not null default now()
);
create index if not exists barbeiros_org_idx on barbeiros(org_id);

create table if not exists servicos (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id) on delete cascade,
  nome            text not null,
  descricao       text,
  duracao_min     integer not null default 45,
  preco_quinzenal numeric(10,2) not null default 0,
  preco_mensal    numeric(10,2) not null default 0,
  preco_eventual  numeric(10,2) not null default 0,
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now()
);
create index if not exists servicos_org_idx on servicos(org_id);

create table if not exists barbeiro_servicos (
  barbeiro_id uuid not null references barbeiros(id) on delete cascade,
  servico_id  uuid not null references servicos(id) on delete cascade,
  primary key (barbeiro_id, servico_id)
);

create table if not exists produtos (
  id                   uuid primary key default uuid_generate_v4(),
  org_id               uuid not null references organizations(id) on delete cascade,
  nome                 text not null,
  descricao            text,
  preco                numeric(10,2) not null default 0,
  estoque              integer not null default 0,
  desconto_por_nivel   jsonb,
  ativo                boolean not null default true,
  criado_em            timestamptz not null default now()
);
create index if not exists produtos_org_idx on produtos(org_id);

create table if not exists niveis (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  numero      integer not null,
  nome        text not null,
  min_fpts    integer not null,
  beneficios  jsonb
);
create index if not exists niveis_org_idx on niveis(org_id);
create unique index if not exists niveis_org_numero_unique on niveis(org_id, numero);

-- ---------- CLIENTES (com auth opcional) -----------------------------

create table if not exists clientes (
  id                   uuid primary key default uuid_generate_v4(),
  org_id               uuid not null references organizations(id) on delete cascade,
  nome                 text not null,
  telefone             text,
  email                text,
  foto_url             text,
  endereco             text,
  aniversario          date,
  filhos               text,
  profissao            text,
  hobby                text,
  fpts                 integer not null default 0,
  -- snapshot denormalizado do cashback disponível em FPTS (sempre ≤ fpts)
  cashback_fpts        integer not null default 0,
  nivel_id             uuid references niveis(id) on delete set null,
  ultima_visita        timestamptz,
  -- auth próprio do cliente (área "Meus Agendamentos" / autoagendamento)
  auth_email           text,
  auth_password_hash   text,
  criado_em            timestamptz not null default now()
);
create index if not exists clientes_org_idx on clientes(org_id);
create index if not exists clientes_telefone_idx on clientes(telefone);
create unique index if not exists clientes_auth_email_unique on clientes(auth_email)
  where auth_email is not null;

create table if not exists cliente_notas (
  id             uuid primary key default uuid_generate_v4(),
  cliente_id     uuid not null references clientes(id) on delete cascade,
  autor_user_id  uuid references users(id) on delete set null,
  texto          text not null,
  criado_em      timestamptz not null default now()
);
create index if not exists cliente_notas_cliente_idx on cliente_notas(cliente_id);

create table if not exists agendamentos (
  id                  uuid primary key default uuid_generate_v4(),
  org_id              uuid not null references organizations(id) on delete cascade,
  cliente_id          uuid references clientes(id) on delete set null,
  barbeiro_id         uuid not null references barbeiros(id) on delete restrict,
  inicio              timestamptz not null,
  fim                 timestamptz not null,
  status              agendamento_status not null default 'agendado',
  servicos            jsonb,
  produtos            jsonb,
  valor_total         numeric(10,2),
  desconto            numeric(10,2),
  cashback_usado_reais numeric(10,2) not null default 0,
  cashback_usado_fpts  integer not null default 0,
  valor_pago          numeric(10,2),
  forma_pagamento     forma_pagamento,
  observacoes         text,
  origem              text not null default 'admin',  -- 'admin' | 'cliente' | 'whatsapp'
  criado_em           timestamptz not null default now()
);
create index if not exists agendamentos_org_idx on agendamentos(org_id);
create index if not exists agendamentos_inicio_idx on agendamentos(inicio);
create index if not exists agendamentos_barbeiro_inicio_idx on agendamentos(barbeiro_id, inicio);
create index if not exists agendamentos_cliente_idx on agendamentos(cliente_id);

create table if not exists pagamentos (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id) on delete cascade,
  agendamento_id  uuid references agendamentos(id) on delete set null,
  valor           numeric(10,2) not null,
  forma           forma_pagamento not null,
  recebido_em     timestamptz not null default now()
);
create index if not exists pagamentos_org_idx on pagamentos(org_id);
create index if not exists pagamentos_recebido_idx on pagamentos(recebido_em);

create table if not exists fpts_eventos (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  cliente_id  uuid not null references clientes(id) on delete cascade,
  tipo        fpts_evento_tipo not null,
  pontos      integer not null,
  descricao   text,
  criado_em   timestamptz not null default now()
);
create index if not exists fpts_eventos_cliente_idx on fpts_eventos(cliente_id);
create index if not exists fpts_eventos_org_idx on fpts_eventos(org_id);

create table if not exists horarios (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  dia_semana  integer not null,
  abertura    time not null,
  fechamento  time not null,
  ativo       boolean not null default true
);
create index if not exists horarios_org_idx on horarios(org_id);

create table if not exists feriados (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references organizations(id) on delete cascade,
  data       date not null,
  descricao  text not null
);
create index if not exists feriados_org_idx on feriados(org_id);

-- ---------- CASHBACK -------------------------------------------------
-- fpts_eventos já registra o crédito (tipo='google|indicacao|instagram|pontualidade|aniversario')
-- e o débito (tipo='resgate'). Esta tabela adiciona metadata do resgate.

create table if not exists cashback_resgates (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id) on delete cascade,
  cliente_id      uuid not null references clientes(id) on delete cascade,
  agendamento_id  uuid references agendamentos(id) on delete set null,
  fpts_debitados  integer not null,
  reais_abatidos  numeric(10,2) not null,
  criado_em       timestamptz not null default now()
);
create index if not exists cashback_resgates_org_idx on cashback_resgates(org_id);
create index if not exists cashback_resgates_cliente_idx on cashback_resgates(cliente_id);
