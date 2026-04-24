// Nomes físicos das tabelas no Supabase.
// Se algum dia quiser trocar a nomenclatura (remover colchetes, mudar
// o prefixo de SAAS pra outro, etc.), mexa só aqui.

export const TABELAS = {
  barbearias: "[SAAS][BARBEARIA][VICTOR][barbearias]",
  equipe: "[SAAS][BARBEARIA][VICTOR][equipe]",
  clientes: "[SAAS][BARBEARIA][VICTOR][clientes]",
  atendimentos: "[SAAS][BARBEARIA][VICTOR][atendimentos]",
} as const;
