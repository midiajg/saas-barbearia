import { supabaseAdmin } from "@/infrastructure/database/client";

export abstract class BaseRepo {
  constructor(protected readonly orgId: string) {
    if (!orgId) throw new Error("orgId é obrigatório no repositório");
  }
  protected get sb() {
    return supabaseAdmin;
  }
}
