import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function Placeholder({
  titulo,
  descricao,
  previsto,
}: {
  titulo: string;
  descricao: string;
  previsto?: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display">{titulo}</h1>
        <p className="text-[var(--color-muted)]">{descricao}</p>
      </div>

      <Card>
        <CardContent className="p-10 text-center space-y-3">
          <div className="inline-flex size-12 rounded-full bg-[var(--color-primary)]/10 items-center justify-center">
            <Construction className="size-5 text-[var(--color-primary)]" />
          </div>
          <p className="font-medium">Em construção</p>
          {previsto && (
            <p className="text-sm text-[var(--color-muted)]">
              Previsto para: {previsto}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
