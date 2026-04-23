// Tipos espelhando schema.sql. Mantenha sincronizado quando alterar o SQL.

export type UserRole = "owner" | "manager" | "barber";
export type Persona = "super_admin" | UserRole | "client";
export type PlanoAssinatura = "trial" | "basico" | "profissional" | "rede";

export type AgendamentoStatus =
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

export type FptsEventoTipo =
  | "google"
  | "indicacao"
  | "instagram"
  | "pontualidade"
  | "aniversario"
  | "resgate"
  | "ajuste_manual";

export type OrigemAgendamento = "admin" | "cliente" | "whatsapp";

export type PlatformAdmin = {
  id: string;
  email: string;
  password_hash: string;
  nome: string;
  criado_em: string;
};

export type FptsRegras = {
  google?: number;
  indicacao?: number;
  instagram?: number;
  pontualidade?: number;
  aniversario?: number;
};

export type Organization = {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  paleta: { primary?: string; background?: string; foreground?: string } | null;
  fuso_horario: string;
  plano: PlanoAssinatura;
  ativa: boolean;
  cashback_fpts_por_real: number;
  cashback_max_pct_por_servico: number;
  fpts_regras: FptsRegras;
  criado_em: string;
};

export type User = {
  id: string;
  org_id: string;
  email: string;
  password_hash: string;
  nome: string;
  role: UserRole;
  criado_em: string;
};

export type Barbeiro = {
  id: string;
  org_id: string;
  user_id: string | null;
  nome: string;
  foto_url: string | null;
  cor: string;
  percentual_comissao: string;
  ativo: boolean;
  criado_em: string;
};

export type Servico = {
  id: string;
  org_id: string;
  nome: string;
  descricao: string | null;
  duracao_min: number;
  preco_quinzenal: string;
  preco_mensal: string;
  preco_eventual: string;
  ativo: boolean;
  criado_em: string;
};

export type Produto = {
  id: string;
  org_id: string;
  nome: string;
  descricao: string | null;
  preco: string;
  estoque: number;
  desconto_por_nivel: Record<number, number> | null;
  ativo: boolean;
  criado_em: string;
};

export type Nivel = {
  id: string;
  org_id: string;
  numero: number;
  nome: string;
  min_fpts: number;
  beneficios: {
    descontoProdutos?: number;
    bonusIndicacao?: number;
    servicosGratis?: string[];
    outros?: string[];
  } | null;
};

export type Cliente = {
  id: string;
  org_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  foto_url: string | null;
  endereco: string | null;
  aniversario: string | null;
  filhos: string | null;
  profissao: string | null;
  hobby: string | null;
  fpts: number;
  cashback_fpts: number;
  nivel_id: string | null;
  ultima_visita: string | null;
  auth_email: string | null;
  auth_password_hash: string | null;
  criado_em: string;
};

export type ClienteNota = {
  id: string;
  cliente_id: string;
  autor_user_id: string | null;
  texto: string;
  criado_em: string;
};

export type AgendamentoServicoItem = {
  servicoId: string;
  nome: string;
  preco: number;
  duracaoMin: number;
};

export type AgendamentoProdutoItem = {
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
};

export type Agendamento = {
  id: string;
  org_id: string;
  cliente_id: string | null;
  barbeiro_id: string;
  inicio: string;
  fim: string;
  status: AgendamentoStatus;
  servicos: AgendamentoServicoItem[] | null;
  produtos: AgendamentoProdutoItem[] | null;
  valor_total: string | null;
  desconto: string | null;
  cashback_usado_reais: string;
  cashback_usado_fpts: number;
  valor_pago: string | null;
  forma_pagamento: FormaPagamento | null;
  observacoes: string | null;
  origem: OrigemAgendamento;
  criado_em: string;
};

export type CashbackResgate = {
  id: string;
  org_id: string;
  cliente_id: string;
  agendamento_id: string | null;
  fpts_debitados: number;
  reais_abatidos: string;
  criado_em: string;
};

export type Pagamento = {
  id: string;
  org_id: string;
  agendamento_id: string | null;
  valor: string;
  forma: FormaPagamento;
  recebido_em: string;
};

export type FptsEvento = {
  id: string;
  org_id: string;
  cliente_id: string;
  tipo: FptsEventoTipo;
  pontos: number;
  descricao: string | null;
  criado_em: string;
};

export type Horario = {
  id: string;
  org_id: string;
  dia_semana: number;
  abertura: string;
  fechamento: string;
  ativo: boolean;
};

export type Feriado = {
  id: string;
  org_id: string;
  data: string;
  descricao: string;
};
