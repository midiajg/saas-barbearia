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

// Valor configurável como R$ ou %. Usado em desconto extra, comissão por
// produto e custo de material por serviço.
export type ValorOuPct = {
  tipo: "real" | "percentual";
  valor: number;
};

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

// Regras de FPTS criadas pela barbearia além das 5 fixas (extensível).
// `icone` é um único caractere/emoji renderizado no botão do card.
export type FptsRegraCustom = {
  id: string;
  icone: string;
  label: string;
  valor: number;
  ativo: boolean;
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
  // Custo de material usado no serviço (descontado da base de comissão).
  // Ex: { tipo: 'real', valor: 5 } = R$5 por serviço.
  custo_material?: ValorOuPct | null;
};

export type CatalogoProduto = {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  desconto_por_nivel: Record<string, number> | null; // { "1": 5, "2": 10, "3": 15 }
  ativo: boolean;
  // Comissão específica deste produto. Quando definida, sobrescreve a
  // comissão padrão do barbeiro APENAS na venda deste produto.
  comissao?: ValorOuPct | null;
};

export type WhatsappConfig = {
  token: string | null;
  instancia: string | null;
};

export type Pacote = {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  quantidade: number | null; // X usos. null = ilimitado durante o período
  recorrente: boolean; // true = mensalidade renovável
  duracao_dias: number; // validade em dias (30 = mensal)
  servicos_inclusos: string[]; // ids do catalogo_servicos. vazio = todos
  ativo: boolean;
};

export type Paleta = {
  primary?: string;
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
  paleta?: Paleta;
  bloqueios?: BloqueioRef[];
  despesas?: DespesaRef[];
  fila_espera?: FilaItemRef[];
  caixa_atual?: CaixaAbertoRef | null;
  caixas_historico?: CaixaFechadoRef[];
  pacotes?: Pacote[];
  pontuacoes_custom?: FptsRegraCustom[];
};

type MovimentoCaixaRef = {
  id: string;
  tipo: "sangria" | "suprimento" | "ajuste";
  valor: number; // sempre positivo; tipo define direção
  motivo?: string;
  hora: string; // ISO
};

type CaixaAbertoRef = {
  id: string;
  aberto_em: string; // ISO
  aberto_por: string; // equipeId
  saldo_inicial: number;
  movimentos: MovimentoCaixaRef[];
};

type CaixaFechadoRef = {
  id: string;
  data: string; // YYYY-MM-DD
  aberto_em: string;
  fechado_em: string;
  aberto_por: string;
  fechado_por: string;
  saldo_inicial: number;
  movimentos: MovimentoCaixaRef[];
  recebido_sistema: number; // soma de pagamentos em dinheiro do dia
  contado_fisico: number;
  diferenca: number; // contado - esperado
};

export type MovimentoCaixa = MovimentoCaixaRef;
export type CaixaAberto = CaixaAbertoRef;
export type CaixaFechado = CaixaFechadoRef;

export type MotivoBloqueio = "almoco" | "ausencia_medica" | "folga" | "outros";

// Refs (mesma shape declarada depois — split pra não dar referência circular)
type BloqueioRef = {
  id: string;
  barbeiro_id: string;
  inicio: string;
  fim: string;
  motivo?: string; // texto livre (mantido pra compatibilidade + caso "outros")
  motivo_tipo?: MotivoBloqueio;
};
type DespesaRef = {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  valor: number;
  pago: boolean;
};
type FilaItemRef = {
  id: string;
  cliente_id: string;
  barbeiro_id?: string;
  observacao?: string;
  criado_em: string;
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
  // Snapshot do custo de material no momento da venda — em R$ já resolvido.
  // Usado pelo relatório de comissões pra descontar da base.
  custo_material?: number;
};

export type ProdutoVendido = {
  id: string;
  nome: string;
  preco: number; // preço final (com desconto de nível aplicado)
  qtd: number;
  desconto_pct?: number;
  // Snapshot da comissão configurada no produto no momento da venda.
  // Quando ausente, comissões aplicam o % padrão do barbeiro.
  comissao?: ValorOuPct;
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
  lider: boolean;
  criado_em: string;
};

// Re-exports pra conveniência
export type Bloqueio = BloqueioRef;
export type Despesa = DespesaRef;
export type FilaItem = FilaItemRef;

export type PacoteAtivo = {
  pacote_id: string;
  nome: string; // snapshot do nome no momento da venda
  inicio: string; // ISO
  fim: string; // ISO
  usos_iniciais: number | null; // null = ilimitado
  usos_restantes: number | null;
  recorrente: boolean;
  servicos_inclusos: string[]; // snapshot
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
  pacote_ativo: PacoteAtivo | null;
  auth_email: string | null;
  auth_senha_hash: string | null;
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
  lembrete_enviado_em: string | null;
  criado_em: string;
};
