import Link from "next/link";
import { BookMarked, Database, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export type CitationChipProps = {
  rank?: number | null;
  journal?: string | null;
  year?: number | null;
  matchLabel?: string;
  href?: string | null;
  className?: string;
  compact?: boolean;
};

export function CitationChip({ rank, journal, year, matchLabel, href, className, compact }: CitationChipProps) {
  const meta = [journal, year].filter(Boolean).join(" · ");
  const body = (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2.5 rounded-xl border border-border/50 bg-background/80 text-left shadow-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-primary/25 hover:bg-sage/30 hover:shadow-md",
        compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs",
        className
      )}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-lg bg-primary/10 text-primary",
          compact ? "h-6 w-6" : "h-7 w-7"
        )}
      >
        {rank != null ? (
          <BookMarked className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
        ) : (
          <Database className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
        )}
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-primary">
            {rank != null ? `Paper #${rank}` : "Source paper"}
          </span>
          {matchLabel ? (
            <span className="rounded-full bg-accent/12 px-1.5 py-0.5 text-[10px] font-bold text-accent">
              {matchLabel}
            </span>
          ) : null}
        </span>
        {meta ? <span className="mt-0.5 block truncate text-muted-foreground">{meta}</span> : null}
      </span>
      {href ? (
        <ExternalLink className={cn("shrink-0 text-muted-foreground", compact ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
      ) : null}
    </span>
  );

  if (!href) return body;

  return (
    <Link href={href} target="_blank" rel="noreferrer" className="inline-flex max-w-full">
      {body}
    </Link>
  );
}
