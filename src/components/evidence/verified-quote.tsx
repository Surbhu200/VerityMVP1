"use client";

import { motion } from "framer-motion";
import { FileText, Quote } from "lucide-react";
import { CitationChip, type CitationChipProps } from "@/components/citation-chip";
import { fadeUp, fadeUpTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

type VerifiedQuoteProps = {
  quote: string;
  label?: string;
  citation?: CitationChipProps;
  className?: string;
  delay?: number;
};

export function VerifiedQuote({
  quote,
  label = "Database extract",
  citation,
  className,
  delay = 0
}: VerifiedQuoteProps) {
  return (
    <motion.figure
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-48px" }}
      transition={fadeUpTransition(delay)}
      className={cn(
        "overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-md",
        className
      )}
    >
      <figcaption className="flex items-center gap-2.5 border-b border-border/40 bg-sage/30 px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">{label}</p>
          <p className="text-[10px] text-muted-foreground">Verified extract — not AI generated</p>
        </div>
      </figcaption>
      <blockquote className="relative bg-primary/[0.04] px-5 py-4">
        <div className="absolute bottom-3 right-4 text-primary/10" aria-hidden>
          <Quote className="h-10 w-10" />
        </div>
        <div className="border-l-[3px] border-primary/45 pl-4">
          <p className="text-balance text-[15px] leading-[1.75] text-foreground/90">&ldquo;{quote}&rdquo;</p>
        </div>
      </blockquote>
      {citation ? (
        <footer className="border-t border-border/40 px-4 py-3">
          <CitationChip compact {...citation} />
        </footer>
      ) : null}
    </motion.figure>
  );
}
