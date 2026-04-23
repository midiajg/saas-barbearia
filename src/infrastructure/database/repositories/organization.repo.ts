import { BaseRepo } from "./base";
import { supabaseAdmin } from "@/infrastructure/database/client";
import type { Organization } from "../types";

/**
 * Lookup público por slug — não passa pelo BaseRepo (não tem orgId).
 * Usado na área pública do cliente (/c/[slug]).
 */
export async function buscarOrganizationPorSlug(
  slug: string
): Promise<Organization | null> {
  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .eq("ativa", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export class OrganizationRepo extends BaseRepo {
  async get(): Promise<Organization | null> {
    const { data, error } = await this.sb
      .from("organizations")
      .select("*")
      .eq("id", this.orgId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async update(input: {
    nome?: string;
    logo_url?: string | null;
    paleta?: Organization["paleta"];
    fuso_horario?: string;
  }): Promise<Organization> {
    const { data, error } = await this.sb
      .from("organizations")
      .update(input)
      .eq("id", this.orgId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
