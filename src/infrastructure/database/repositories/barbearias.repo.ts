import { supabaseAdmin } from "@/infrastructure/database/client";
import { TABELAS } from "@/infrastructure/database/tabelas";
import type {
  Barbearia,
  BarbeariaConfig,
  CatalogoProduto,
  CatalogoServico,
  Feriado,
  Horario,
  Nivel,
  PlanoAssinatura,
  WhatsappConfig,
} from "../types";

const CONFIG_PADRAO: BarbeariaConfig = {
  horarios: [],
  feriados: [],
  niveis: [],
  fpts_regras: {
    google: 500,
    indicacao: 500,
    instagram: 300,
    pontualidade: 100,
    aniversario: 200,
  },
  cashback: { fpts_por_real: 100, max_pct: 30 },
  catalogo_servicos: [],
  catalogo_produtos: [],
  whatsapp: { token: null, instancia: null },
};

function normalizarConfig(raw: unknown): BarbeariaConfig {
  const base = (raw ?? {}) as Partial<BarbeariaConfig>;
  return {
    ...CONFIG_PADRAO,
    ...base,
    fpts_regras: { ...CONFIG_PADRAO.fpts_regras, ...(base.fpts_regras ?? {}) },
    cashback: { ...CONFIG_PADRAO.cashback, ...(base.cashback ?? {}) },
    whatsapp: { ...CONFIG_PADRAO.whatsapp, ...(base.whatsapp ?? {}) },
    horarios: base.horarios ?? [],
    feriados: base.feriados ?? [],
    niveis: base.niveis ?? [],
    catalogo_servicos: base.catalogo_servicos ?? [],
    catalogo_produtos: base.catalogo_produtos ?? [],
  };
}

function hidratar(raw: unknown): Barbearia {
  const r = raw as Barbearia & { config: unknown };
  return { ...r, config: normalizarConfig(r.config) };
}

export async function buscarBarbeariaPorSlug(
  slug: string
): Promise<Barbearia | null> {
  const { data, error } = await supabaseAdmin
    .from(TABELAS.barbearias)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? hidratar(data) : null;
}

export async function buscarBarbeariaPorId(
  id: string
): Promise<Barbearia | null> {
  const { data, error } = await supabaseAdmin
    .from(TABELAS.barbearias)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? hidratar(data) : null;
}

export async function criarBarbearia(input: {
  nome: string;
  slug: string;
  telefone?: string;
}): Promise<Barbearia> {
  const { data, error } = await supabaseAdmin
    .from(TABELAS.barbearias)
    .insert({
      nome: input.nome,
      slug: input.slug,
      telefone: input.telefone,
      config: CONFIG_PADRAO,
    })
    .select()
    .single();
  if (error) throw error;
  return hidratar(data);
}

export class BarbeariasRepo {
  constructor(private readonly id: string) {
    if (!id) throw new Error("id obrigatório");
  }
  private get sb() {
    return supabaseAdmin;
  }

  async get(): Promise<Barbearia | null> {
    return buscarBarbeariaPorId(this.id);
  }

  async atualizarPerfil(input: {
    nome?: string;
    telefone?: string | null;
    logo_url?: string | null;
    plano?: PlanoAssinatura;
  }): Promise<Barbearia> {
    const { data, error } = await this.sb
      .from(TABELAS.barbearias)
      .update(input)
      .eq("id", this.id)
      .select()
      .single();
    if (error) throw error;
    return hidratar(data);
  }

  async atualizarConfig(parcial: Partial<BarbeariaConfig>): Promise<Barbearia> {
    const atual = await this.get();
    if (!atual) throw new Error("Barbearia não encontrada");
    const novo = {
      ...atual.config,
      ...parcial,
      fpts_regras: {
        ...atual.config.fpts_regras,
        ...(parcial.fpts_regras ?? {}),
      },
      cashback: { ...atual.config.cashback, ...(parcial.cashback ?? {}) },
      whatsapp: { ...atual.config.whatsapp, ...(parcial.whatsapp ?? {}) },
    };
    const { data, error } = await this.sb
      .from(TABELAS.barbearias)
      .update({ config: novo })
      .eq("id", this.id)
      .select()
      .single();
    if (error) throw error;
    return hidratar(data);
  }

  // ---- helpers específicos de catálogo / horários / níveis ----
  async salvarHorarios(horarios: Horario[]): Promise<Barbearia> {
    return this.atualizarConfig({ horarios });
  }
  async salvarFeriados(feriados: Feriado[]): Promise<Barbearia> {
    return this.atualizarConfig({ feriados });
  }
  async salvarNiveis(niveis: Nivel[]): Promise<Barbearia> {
    return this.atualizarConfig({ niveis });
  }
  async salvarCatalogoServicos(
    catalogo: CatalogoServico[]
  ): Promise<Barbearia> {
    return this.atualizarConfig({ catalogo_servicos: catalogo });
  }
  async salvarCatalogoProdutos(
    catalogo: CatalogoProduto[]
  ): Promise<Barbearia> {
    return this.atualizarConfig({ catalogo_produtos: catalogo });
  }
  async salvarWhatsapp(wa: WhatsappConfig): Promise<Barbearia> {
    return this.atualizarConfig({ whatsapp: wa });
  }
}

export async function listarTodasBarbeariasAtivas(): Promise<Barbearia[]> {
  const { data, error } = await supabaseAdmin.from(TABELAS.barbearias).select("*");
  if (error) throw error;
  return (data ?? []).map(hidratar);
}
