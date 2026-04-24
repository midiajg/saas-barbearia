import { comissoesPorPeriodo } from "./actions";
import { ComissoesClient } from "./comissoes-client";

function isoDia(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function ComissoesPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const params = await searchParams;
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const deISO = params.de ?? isoDia(inicioMes);
  const ateISO = params.ate ?? isoDia(agora);

  const linhas = await comissoesPorPeriodo(
    new Date(deISO + "T00:00:00").toISOString(),
    new Date(ateISO + "T23:59:59").toISOString()
  );

  return <ComissoesClient linhas={linhas} deInicial={deISO} ateInicial={ateISO} />;
}
