"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { CitationChip } from "@/components/citation-chip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { paperMatchLabel } from "@/lib/product-verdict";
import { studyLabel } from "@/lib/product-helpers";
import type { MarketplaceProduct } from "@/lib/products";
import { cn } from "@/lib/utils";

type PaperLike = MarketplaceProduct["research"][number];

type PaperProtocolDialogProps = {
  paper: PaperLike;
  isSupplement?: boolean;
  layoutIdPrefix?: string;
  className?: string;
};

export function PaperProtocolDialog({
  paper,
  isSupplement = true,
  layoutIdPrefix = "protocol",
  className
}: PaperProtocolDialogProps) {
  const [open, setOpen] = React.useState(false);
  const layoutId = `${layoutIdPrefix}-${paper.id}`;
  const protocolLabel = isSupplement ? "Dosage & protocol" : "Study protocol";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <motion.button
        type="button"
        layoutId={layoutId}
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-semibold text-primary shadow-soft transition hover:border-accent/30 hover:bg-sage/20",
          className
        )}
      >
        <ClipboardList className="h-4 w-4 text-accent" aria-hidden />
        {protocolLabel}
      </motion.button>

      <DialogContent layoutId={layoutId} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{protocolLabel}</DialogTitle>
          <DialogDescription>
            {studyLabel(paper.article.studyType)} · {paperMatchLabel(paper.matchConfidence)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed text-primary/90">
          <p className="font-semibold text-primary">{paper.article.title}</p>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{protocolLabel}</dt>
              <dd className="mt-1">{paper.summary?.dosage ?? "Protocol details pending review."}</dd>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Efficacy</dt>
              <dd className="mt-1">{paper.summary?.efficacy ?? "—"}</dd>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Limitations</dt>
              <dd className="mt-1">{paper.summary?.limitations ?? "—"}</dd>
            </div>
          </dl>
          <CitationChip
            rank={paper.rank}
            journal={paper.article.journal}
            year={paper.article.publicationYear}
            matchLabel={paperMatchLabel(paper.matchConfidence)}
            href={paper.article.url}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}