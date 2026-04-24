-- =====================================================================
-- Barbearia — Schema SQL · 4 tabelas
-- =====================================================================
-- Nomenclatura: [SAAS][BARBEARIA][VICTOR][<tabela>]
-- Identificadores com colchetes exigem aspas duplas no Postgres.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- 1. barbearias — config tudo em JSONB
create table if not exists "[SAAS][BARBEARIA][VICTOR][barbearias]" (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  slug        text not null unique,
  telefone    text,
  logo_url    text,
  plano       text not null default 'trial',
  config      jsonb not null default '{
    "horarios": [],
    "feriados": [],
    "niveis": [],
    "fpts_regras": {"google":500,"indicacao":500,"instagram":300,"pontualidade":100,"aniversario":200},
    "cashback": {"fpts_por_real":100,"max_pct":30},
    "catalogo_servicos": [],
    "catalogo_produtos": [],
    "whatsapp": {"token":null,"instancia":null}
  }'::jsonb,
  criada_em   timestamptz not null default now()
);

-- 2. equipe
create table if not exists "[SAAS][BARBEARIA][VICTOR][equipe]" (
  id            uuid primary key default uuid_generate_v4(),
  barbearia_id  uuid not null references "[SAAS][BARBEARIA][VICTOR][barbearias]"(id) on delete cascade,
  nome          text not null,
  email         text not null,
  senha_hash    text not null,
  cargo         text not null default 'barbeiro',
  foto_url      text,
  cor           text default '#45D4C0',
  comissao_pct  numeric(5,2) default 50,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  unique (barbearia_id, email)
);
create index if not exists equipe_barbearia_idx
  on "[SAAS][BARBEARIA][VICTOR][equipe]" (barbearia_id);

-- 3. clientes
create table if not exists "[SAAS][BARBEARIA][VICTOR][clientes]" (
  id              uuid primary key default uuid_generate_v4(),
  barbearia_id    uuid not null references "[SAAS][BARBEARIA][VICTOR][barbearias]"(id) on delete cascade,
  nome            text not null,
  telefone        text,
  email           text,
  foto_url        text,
  dados_pessoais  jsonb,
  fpts            integer not null default 0,
  cashback_fpts   integer not null default 0,
  ultima_visita   timestamptz,
  eventos_fpts    jsonb not null default '[]'::jsonb,
  criado_em       timestamptz not null default now()
);
create index if not exists clientes_barbearia_idx
  on "[SAAS][BARBEARIA][VICTOR][clientes]" (barbearia_id);
create index if not exists clientes_telefone_idx
  on "[SAAS][BARBEARIA][VICTOR][clientes]" (telefone);

-- 4. atendimentos
create table if not exists "[SAAS][BARBEARIA][VICTOR][atendimentos]" (
  id                    uuid primary key default uuid_generate_v4(),
  barbearia_id          uuid not null references "[SAAS][BARBEARIA][VICTOR][barbearias]"(id) on delete cascade,
  cliente_id            uuid references "[SAAS][BARBEARIA][VICTOR][clientes]"(id) on delete set null,
  barbeiro_id           uuid not null references "[SAAS][BARBEARIA][VICTOR][equipe]"(id) on delete restrict,
  inicio                timestamptz not null,
  fim                   timestamptz not null,
  status                text not null default 'agendado',
  servicos              jsonb,
  produtos              jsonb,
  valor_total           numeric(10,2),
  desconto              numeric(10,2) default 0,
  cashback_usado_reais  numeric(10,2) default 0,
  cashback_usado_fpts   integer default 0,
  valor_pago            numeric(10,2),
  forma_pagamento       text,
  observacoes           text,
  criado_em             timestamptz not null default now()
);
create index if not exists atendimentos_barbearia_inicio_idx
  on "[SAAS][BARBEARIA][VICTOR][atendimentos]" (barbearia_id, inicio);
create index if not exists atendimentos_barbeiro_inicio_idx
  on "[SAAS][BARBEARIA][VICTOR][atendimentos]" (barbeiro_id, inicio);
create index if not exists atendimentos_cliente_idx
  on "[SAAS][BARBEARIA][VICTOR][atendimentos]" (cliente_id);
