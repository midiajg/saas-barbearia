import { supabaseAdmin } from "@/infrastructure/database/client";

export abstract class BaseRepo {
  constructor(protected readonly barbeariaId: string) {
    if (!barbeariaId) throw new Error("barbeariaId é obrigatório no repositório");
  }
  protected get sb() {
    return supabaseAdmin;
  }
}
