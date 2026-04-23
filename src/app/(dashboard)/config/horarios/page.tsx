import { requireStaffSession } from "@/lib/auth/session";
import { HorariosRepo } from "@/infrastructure/database/repositories/horarios.repo";
import { HorariosForm } from "./horarios-form";
import { FeriadosCard } from "./feriados-card";

export default async function HorariosPage() {
  const session = await requireStaffSession();
  const repo = new HorariosRepo(session.orgId);
  const [horarios, feriados] = await Promise.all([
    repo.listSemana(),
    repo.listFeriados(),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-display">Horários</h1>
        <p className="text-[var(--color-muted)]">
          Funcionamento semanal e feriados
        </p>
      </div>

      <HorariosForm horarios={horarios} />
      <FeriadosCard feriados={feriados} />
    </div>
  );
}
