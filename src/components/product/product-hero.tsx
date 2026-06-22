"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronDown, ShoppingCart, Sparkles } from "lucide-react";
import { ScoreVisual } from "@/components/score-visual";
import { Button } from "@/components/ui/button";
import { getProductVerdict } from "@/lib/product-verdict";
import { productKind } from "@/lib/product-helpers";
import type { MarketplaceProduct } from "@/lib/products";
import { fadeUp, fadeUpTransition } from "@/lib/motion";
import { cn, formatCurrency } from "@/lib/utils";

type ProductHeroProps = {
  product: MarketplaceProduct;
  className?: string;
};

export function ProductHero({ product, className }: ProductHeroProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const image = product.imageUrls[0];
  const healthScore = product.score?.healthScore ?? 0;
  const valueScore = product.score?.valueScore ?? 0;
  const kind = productKind(product);
  const fitLabel = kind === "supplement" ? "Product Fit Score" : "Product Fit Score";
  const verdict = getProductVerdict(product);

  return (
    <section
      className={cn(
        "relative border-b border-border/50 bg-gradient-to-b from-sage/25 via-background to-background",
        className
      )}
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-20">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={fadeUpTransition(0)}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              {product.category}
            </span>
            {product.brand ? (
              <span className="rounded-full border border-border/50 bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                {product.brand}
              </span>
            ) : null}
          </div>

          <h1 className="mt-5 font-display text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.15rem] lg:leading-[1.08]">
            {product.name}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-[1.75] text-muted-foreground">{product.description}</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <ScoreVisual
              label="Evidence Score"
              score={healthScore}
              grade={product.score?.evidenceGrade ?? "Limited"}
              highlight
              variant="hero"
              delay={0.05}
            />
            <ScoreVisual
              label={fitLabel}
              score={valueScore}
              grade={product.score?.valueGrade ?? "Emerging"}
              variant="hero"
              delay={0.12}
            />
          </div>

          <motion.div
            layout
            className="mt-8 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-sage/50 via-card to-card p-6 shadow-sm"
            transition={fadeUpTransition(0.18)}
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Bottom line</p>
                <p className="mt-2 text-base font-medium leading-[1.7] text-foreground">{verdict.headline}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{verdict.caveat}</p>
              </div>
            </div>
          </motion.div>

          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-accent"
          >
            {detailsOpen ? "Hide product context" : "Show product context"}
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", detailsOpen && "rotate-180")} aria-hidden />
          </button>

          {detailsOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 overflow-hidden rounded-xl border border-border/50 bg-muted/30 p-5 text-sm text-muted-foreground"
            >
              <p className="font-semibold text-foreground">Good for</p>
              <p className="mt-1.5 leading-relaxed">{verdict.goodFor}</p>
              {product.score?.explanation ? (
                <p className="mt-4 leading-relaxed">{product.score.explanation}</p>
              ) : null}
            </motion.div>
          ) : null}
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={fadeUpTransition(0.1)}
          className="relative lg:sticky lg:top-28"
        >
          <div className="relative min-h-[380px] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm lg:min-h-[460px]">
            {image ? (
              <Image
                src={image}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/90 px-4 py-3 shadow-sm backdrop-blur-md">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Evidence Score</p>
                <p className="font-display text-2xl font-bold tabular-nums text-accent">{healthScore}</p>
              </div>
              <p className="truncate text-right text-xs font-medium text-muted-foreground">
                {product.score?.evidenceGrade ?? "Limited"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="sticky bottom-4 z-30 mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/85 px-4 py-3 shadow-md backdrop-blur-md sm:px-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ready to purchase</p>
            <p className="font-display text-lg font-semibold tabular-nums text-foreground">
              {formatCurrency(product.price, product.currency)}
            </p>
          </div>
          <Button asChild size="lg" className="shadow-sm">
            <a href={product.amazonAffiliateLink} target="_blank" rel="noreferrer">
              <ShoppingCart className="h-4 w-4" aria-hidden />
              Buy on Amazon
            </a>
          </Button>
          <p className="flex w-full items-center gap-1.5 text-[11px] text-muted-foreground sm:w-auto">
            <Sparkles className="h-3 w-3 shrink-0 text-primary/70" aria-hidden />
            Affiliate disclosure — scores reflect cited research, not medical advice.
          </p>
        </div>
      </div>
    </section>
  );
}
