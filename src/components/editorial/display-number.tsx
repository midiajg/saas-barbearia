import { cn } from "@/lib/utils";

/**
 * Número de display — pra KPIs e estatísticas.
 * Tipografia mono com tabular-nums, escala editorial.
 */
export function DisplayNumber({
  value,
  prefix,
  suffix,
  size = "md",
  className,
}: {
  value: string | number;
  prefix?: string;
  suffix?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "text-2xl",
    md: "text-3xl sm:text-4xl",
    lg: "text-4xl sm:text-5xl",
    xl: "text-5xl sm:text-6xl md:text-7xl",
  };
  return (
    <p className={cn("display-num font-light leading-none", sizes[size], className)}>
      {prefix && (
        <span className="text-[var(--color-muted)] text-[0.55em] mr-1 align-top">
          {prefix}
        </span>
      )}
      {value}
      {suffix && (
        <span className="text-[var(--color-muted)] text-[0.5em] ml-1 align-baseline">
          {suffix}
        </span>
      )}
    </p>
  );
}
