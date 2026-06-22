"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { CitationChip, type CitationChipProps } from "@/components/citation-chip";
import { CitationRef } from "@/components/evidence/citation-ref";
import { fadeUp, fadeUpTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

type CitationFootnote = {
  index: number;
  chip: CitationChipProps;
  onRefClick?: () => void;
};

type AISummaryProps = {
  title?: string;
  children: ReactNode;
  citations?: CitationFootnote[];
  variant?: "card" | "inline";
  className?: string;
  delay?: number;
};

export function AISummary({
  title = "AI summary",
  children,
  citations = [],
  variant = "card",
  className,
  delay = 0
}: AISummaryProps) {
  const isInline = variant === "inline";

  if (isInline) {
    return (
      <motion.span
        initial={fadeUp.hidden}
        whileInView={fadeUp.visible}
        viewport={{ once: true, margin: "-32px" }}
        transition={fadeUpTransition(delay)}
        className={cn("inline text-sm leading-relaxed text-muted-foreground", className)}
      >
        {children}
        {citations[0] ? (
          <>
            {" "}
            <CitationRef index={citations[0].index} onClick={citations[0].onRefClick} className="align-super" />
          </>
        ) : null}
      </motion.span>
    );
  }

  return (
    <motion.article
      initial={fadeUp.hidden}
      whileInView={fadeUp.visible}
      viewport={{ once: true, margin: "-48px" }}
      transition={fadeUpTransition(delay)}
      className={cn(
        "overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-sage/40 via-card to-card shadow-sm transition-all duration-300 hover:shadow-md",
        className
      )}
    >
      <header className="flex items-center gap-3 border-b border-border/40 bg-accent/[0.04] px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/12 text-accent">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">{title}</p>
          <p className="text-[10px] text-muted-foreground">Synthesized for readability — tethered to sources below</p>
        </div>
      </header>
      <div className="px-4 py-4">
        <p className="text-balance text-[15px] leading-[1.75] text-foreground/90">{children}</p>
      </div>
      {citations.length ? (
        <footer className="flex flex-wrap items-center gap-2 border-t border-border/40 bg-muted/20 px-4 py-3">
          {citations.map((item) => (
            <span key={item.index} className="inline-flex items-center gap-1.5">
              <CitationRef index={item.index} onClick={item.onRefClick} />
              <CitationChip compact {...item.chip} />
            </span>
          ))}
        </footer>
      ) : null}
    </motion.article>
  );
}
