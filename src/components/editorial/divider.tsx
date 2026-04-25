import { cn } from "@/lib/utils";

/**
 * Filete editorial — regra horizontal fina com ornamento opcional ao centro.
 * Inspirado em separadores de magazine antigo.
 */
export function EditorialDivider({
  ornament,
  className,
}: {
  ornament?: string | React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex-1 h-px bg-[var(--color-hairline)]" />
      {ornament !== undefined && (
        <span className="text-[var(--color-muted)] text-xs font-mono tracking-widest">
          {ornament}
        </span>
      )}
      <div className="flex-1 h-px bg-[var(--color-hairline)]" />
    </div>
  );
}

/**
 * Regra dupla — filete + sub-filete fino abaixo, estilo cabeçalho de jornal.
 */
export function DoubleRule({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="h-px bg-[var(--color-foreground)]/40" />
      <div className="h-px bg-[var(--color-hairline)]" />
    </div>
  );
}
