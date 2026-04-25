import { notFound } from "next/navigation";
import { buscarBarbeariaPorSlug } from "@/infrastructure/database/repositories/barbearias.repo";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const barbearia = await buscarBarbeariaPorSlug(slug);
  if (!barbearia) notFound();

  const corPrimaria = barbearia.config.paleta?.primary ?? "#45D4C0";

  return (
    <div style={{ ["--color-primary" as string]: corPrimaria }}>{children}</div>
  );
}
