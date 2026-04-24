// Tipos espelhando schema.sql (4 tabelas: barbearias, equipe, clientes, atendimentos).

// ---------- Enums (strings literais, não pg enums) --------------------
export type Cargo = "dono" | "gerente" | "barbeiro";
export type PlanoAssinatura = "trial" | "basico" | "pro" | "rede";

export type StatusAtendimento =
  | "agendado"
  | "confirmado"
  | "em_atendimento"
  | "realizado"
  | "no_show"
  | "cancelado";

export type FormaPagamento =
  | "dinheiro"
  | "pix"
  | "cartao_debito"
  | "cartao_credito"
  | "fiado";

export type TipoEventoFpts =
  | "google"
  | "indicacao"
  | "instagram"
  | "pontualidade"
  | "aniversario"
  | "resgate"
  | "ajuste";

// ---------- JSONB shapes ----------------------------------------------

export type Horario = {
  dia_semana: number; // 0=domingo ... 6=sábado
  abertura: string; // "HH:MM"
  fechamento: string; // "HH:MM"
  ativo: boolean;
};

export type Feriado = {
  data: string; // "YYYY-MM-DD"
  descricao: string;
};

export type Nivel = {
  numero: number; // 1, 2, 3...
  nome: string; // "Bronze", "Prata", "Ouro"
  min_fpts: number;
  beneficios: string[]; // ["15% em produtos", "1 hidracorte/mês"]
};

export type FptsRegras = {
  google: number;
  indicacao: number;
  instagram: number;
  pontualidade: number;
  aniversario: number;
};

export type CashbackRegra = {
  fpts_por_real: number;
  max_pct: number;
};

export type CatalogoServico = {
  id: string; // uuid gerado no client
  nome: string;
  descricao?: string;
  duracao_min: number;
  preco_quinzenal: number;
  preco_mensal: number;
  preco_eventual: number;
  ativo: boolean;
};

export type CatalogoProduto = {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  desconto_por_nivel: Record<string, number> | null; // { "1": 5, "2": 10, "3": 15 }
  ativo: boolean;
};

export type WhatsappConfig = {
  token: string | null;
  instancia: string | null;
};

export type BarbeariaConfig = {
  horarios: Horario[];
  feriados: Feriado[];
  niveis: Nivel[];
  fpts_regras: FptsRegras;
  cashback: CashbackRegra;
  catalogo_servicos: CatalogoServico[];
  catalogo_produtos: CatalogoProduto[];
  whatsapp: WhatsappConfig;
};

export type DadosPessoais = {
  endereco?: string;
  aniversario?: string; // "YYYY-MM-DD"
  filhos?: string;
  profissao?: string;
  hobby?: string;
};

export type EventoFpts = {
  tipo: TipoEventoFpts;
  pontos: number;
  descricao?: string;
  data: string; // ISO
};

export type ServicoAtendido = {
  id: string;
  nome: string;
  preco: number;
  duracao_min: number;
};

export type ProdutoVendido = {
  id: string;
  nome: string;
  preco: number; // preço final (com desconto de nível aplicado)
  qtd: number;
  desconto_pct?: number;
};

// ---------- Entidades -------------------------------------------------

export type Barbearia = {
  id: string;
  nome: string;
  slug: string;
  telefone: string | null;
  logo_url: string | null;
  plano: PlanoAssinatura;
  config: BarbeariaConfig;
  criada_em: string;
};

export type Equipe = {
  id: string;
  barbearia_id: string;
  nome: string;
  email: string;
  senha_hash: string;
  cargo: Cargo;
  foto_url: string | null;
  cor: string;
  comissao_pct: string; // numeric vira string
  ativo: boolean;
  criado_em: string;
};

export type Cliente = {
  id: string;
  barbearia_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  foto_url: string | null;
  dados_pessoais: DadosPessoais | null;
  fpts: number;
  cashback_fpts: number;
  ultima_visita: string | null;
  eventos_fpts: EventoFpts[];
  criado_em: string;
};

export type Atendimento = {
  id: string;
  barbearia_id: string;
  cliente_id: string | null;
  barbeiro_id: string;
  inicio: string;
  fim: string;
  status: StatusAtendimento;
  servicos: ServicoAtendido[] | null;
  produtos: ProdutoVendido[] | null;
  valor_total: string | null;
  desconto: string | null;
  cashback_usado_reais: string;
  cashback_usado_fpts: number;
  valor_pago: string | null;
  forma_pagamento: FormaPagamento | null;
  observacoes: string | null;
  criado_em: string;
};
