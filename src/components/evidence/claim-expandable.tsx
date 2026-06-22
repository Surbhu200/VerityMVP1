"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { CitationChip } from "@/components/citation-chip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { claimMatchLabel } from "@/lib/product-verdict";
import { paperForBenefit } from "@/lib/product-helpers";
import type { MarketplaceProduct } from "@/lib/products";
import { cn } from "@/lib/utils";

export type ClaimExpandableItem = {
  id: string;
  claim: string;
  confidence: number;
  articleId?: string | null;
  articleRank?: number | null;
};

type ClaimExpandableProps = {
  product: MarketplaceProduct;
  benefit: ClaimExpandableItem;
  layoutIdPrefix?: string;
  className?: string;
};

export function ClaimExpandable({ product, benefit, layoutIdPrefix = "claim", className }: ClaimExpandableProps) {
  const [open, setOpen] = React.useState(false);
  const paper = paperForBenefit(product, benefit.articleId);
  const layoutId = `${layoutIdPrefix}-${benefit.id}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <motion.button
        type="button"
        layoutId={layoutId}
        onClick={() => setOpen(true)}
        className={cn(
          "group w-full rounded-xl border border-border bg-card p-4 text-left shadow-soft transition hover:border-accent/30 hover:shadow-lift",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Verified claim
            </div>
            <p className="mt-2 font-semibold leading-snug text-primary">{benefit.claim}</p>
            <p className="mt-2 text-xs font-medium text-muted-foreground">{claimMatchLabel(benefit.confidence)}</p>
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
        </div>
      </motion.button>

      <DialogContent layoutId={layoutId} className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Claim evidence</DialogTitle>
          <DialogDescription>{claimMatchLabel(benefit.confidence)} — tied to a ranked source paper.</DialogDescription>
        </DialogHeader>
        <p className="text-sm leading-relaxed text-primary">{benefit.claim}</p>
        {paper ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold text-primary">{paper.article.title}</p>
            {paper.summary?.limitations ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{paper.summary.limitations}</p>
            ) : null}
            <CitationChip
              rank={paper.rank}
              journal={paper.article.journal}
              year={paper.article.publicationYear}
              matchLabel={claimMatchLabel(benefit.confidence)}
              href={paper.article.url}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type ClaimExpandableGridProps = {
  product: MarketplaceProduct;
  className?: string;
  layoutIdPrefix?: string;
};

export function ClaimExpandableGrid({ product, className, layoutIdPrefix = "claim" }: ClaimExpandableGridProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {product.benefits.map((benefit) => (
        <ClaimExpandable key={benefit.id} product={product} benefit={benefit} layoutIdPrefix={layoutIdPrefix} />
      ))}
    </div>
  );
}