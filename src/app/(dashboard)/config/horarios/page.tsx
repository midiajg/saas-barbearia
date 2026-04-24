import { requireDonoOuGerente } from "@/lib/auth/session";
import { BarbeariasRepo } from "@/infrastructure/database/repositories/barbearias.repo";
import { HorariosForm } from "./horarios-form";
import { FeriadosCard } from "./feriados-card";

export default async function HorariosPage() {
  const session = await requireDonoOuGerente();
  const repo = new BarbeariasRepo(session.barbeariaId);
  const barbearia = await repo.get();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-display">Horários</h1>
        <p className="text-[var(--color-muted)]">
          Funcionamento semanal e feriados
        </p>
      </div>

      <HorariosForm horarios={barbearia?.config.horarios ?? []} />
      <FeriadosCard feriados={barbearia?.config.feriados ?? []} />
    </div>
  );
}
