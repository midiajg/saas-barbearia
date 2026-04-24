-- =====================================================================
-- Barbearia — Schema SQL (Supabase) · 4 tabelas
-- =====================================================================
-- Cole este arquivo no Supabase SQL Editor.
--
-- Filosofia: tudo que muda pouco (catálogo, horários, níveis, FPTS regras,
-- WhatsApp) vive em JSONB dentro de `barbearias`. Log de eventos FPTS vira
-- array JSONB em `clientes`. Pagamento é campo do atendimento (não tabela
-- separada). Isso elimina ~12 tabelas de acoplamento sem perder nada.
--
-- Multi-tenant: toda tabela tem `barbearia_id`. Scoping na camada de aplicação.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- =====================================================================
-- 1. barbearias — config tudo em JSONB
-- =====================================================================
create table if not exists barbearias (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  slug        text not null unique,
  telefone    text,
  logo_url    text,
  plano       text not null default 'trial',   -- trial|basico|pro|rede
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

-- =====================================================================
-- 2. equipe — staff da barbearia (dono, gerente, barbeiro). Quem atende tem auth.
-- =====================================================================
create table if not exists equipe (
  id            uuid primary key default uuid_generate_v4(),
  barbearia_id  uuid not null references barbearias(id) on delete cascade,
  nome          text not null,
  email         text not null,
  senha_hash    text not null,
  cargo         text not null default 'barbeiro',   -- dono|gerente|barbeiro
  foto_url      text,
  cor           text default '#45D4C0',
  comissao_pct  numeric(5,2) default 50,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  unique (barbearia_id, email)
);
create index if not exists equipe_barbearia_idx on equipe (barbearia_id);

-- =====================================================================
-- 3. clientes — cadastro + FPTS + dados relacionais + log de eventos
-- dados_pessoais JSONB  = { endereco, aniversario, filhos, profissao, hobby }
-- eventos_fpts   JSONB  = [{ tipo, pontos, descricao, data }]
-- =====================================================================
create table if not exists clientes (
  id              uuid primary key default uuid_generate_v4(),
  barbearia_id    uuid not null references barbearias(id) on delete cascade,
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
create index if not exists clientes_barbearia_idx on clientes (barbearia_id);
create index if not exists clientes_telefone_idx on clientes (telefone);

-- =====================================================================
-- 4. atendimentos — agendamento + fechamento + pagamento num registro só
-- servicos JSONB = [{ nome, preco, duracao_min }]   (snapshot histórico)
-- produtos JSONB = [{ nome, preco, qtd, desconto_pct }]
-- =====================================================================
create table if not exists atendimentos (
  id                    uuid primary key default uuid_generate_v4(),
  barbearia_id          uuid not null references barbearias(id) on delete cascade,
  cliente_id            uuid references clientes(id) on delete set null,
  barbeiro_id           uuid not null references equipe(id) on delete restrict,
  inicio                timestamptz not null,
  fim                   timestamptz not null,
  status                text not null default 'agendado',  -- agendado|confirmado|realizado|no_show|cancelado
  servicos              jsonb,
  produtos              jsonb,
  valor_total           numeric(10,2),
  desconto              numeric(10,2) default 0,
  cashback_usado_reais  numeric(10,2) default 0,
  cashback_usado_fpts   integer default 0,
  valor_pago            numeric(10,2),
  forma_pagamento       text,   -- dinheiro|pix|cartao_debito|cartao_credito|fiado
  observacoes           text,
  criado_em             timestamptz not null default now()
);
create index if not exists atendimentos_barbearia_inicio_idx on atendimentos (barbearia_id, inicio);
create index if not exists atendimentos_barbeiro_inicio_idx on atendimentos (barbeiro_id, inicio);
create index if not exists atendimentos_cliente_idx on atendimentos (cliente_id);
