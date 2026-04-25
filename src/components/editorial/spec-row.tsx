import { cn } from "@/lib/utils";

/**
 * Linha de especificação — label à esquerda em mono pequeno, valor à direita.
 * Inspirado em ficha técnica/colofão editorial.
 *
 *   ÚLTIMA VISITA ─────────────────────────── HÁ 7 DIAS
 *   FPTS ACUMULADOS ────────────────────────────  1.450
 */
export function SpecRow({
  label,
  value,
  emphasis,
  className,
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline gap-3 py-2",
        className
      )}
    >
      <span className="eyebrow shrink-0">{label}</span>
      <span
        className="flex-1 border-b border-dotted border-[var(--color-hairline)] translate-y-[-3px]"
        aria-hidden
      />
      <span
        className={cn(
          "shrink-0 text-right tabular-nums",
          emphasis
            ? "font-mono text-[var(--color-primary)] font-medium"
            : "font-mono text-sm"
        )}
      >
        {value}
      </span>
    </div>
  );
}
