import { cn } from "@/lib/utils";

type CitationRefProps = {
  index: number;
  onClick?: () => void;
  className?: string;
  active?: boolean;
};

export function CitationRef({ index, onClick, className, active }: CitationRefProps) {
  const label = `[${index}]`;
  const base = cn(
    "inline-flex min-w-[1.4rem] items-center justify-center rounded-md px-1 py-0.5 text-[10px] font-bold tabular-nums transition-all duration-300",
    "border border-primary/15 bg-primary/8 text-primary",
    onClick ? "cursor-pointer hover:border-primary/30 hover:bg-primary/15" : "",
    active ? "border-accent/30 bg-accent/12 text-accent" : "",
    className
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={base} aria-label={`Citation ${index}`}>
        {label}
      </button>
    );
  }

  return <span className={base}>{label}</span>;
}
