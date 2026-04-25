import { cn } from "@/lib/utils";

/**
 * Sobrancelha — label letra-espaçada acima de manchetes/seções.
 * Padrão editorial: "ESTABELECIDO 2026", "VOLUME I · CAPÍTULO 3".
 */
type EyebrowProps = React.HTMLAttributes<HTMLParagraphElement> & {
  marker?: boolean;
};

export function Eyebrow({
  children,
  className,
  marker,
  ...rest
}: EyebrowProps) {
  return (
    <p className={cn("eyebrow flex items-center gap-2", className)} {...rest}>
      {marker && (
        <span className="size-1 rounded-full bg-[var(--color-primary)] shrink-0" />
      )}
      {children}
    </p>
  );
}
