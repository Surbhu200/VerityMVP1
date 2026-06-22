"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { ScoreVisual } from "@/components/score-visual";
import type { MarketplaceProduct } from "@/lib/products";
import { springSoft } from "@/lib/motion";
import { cn, formatCurrency } from "@/lib/utils";

export function ProductCard({ product, className }: { product: MarketplaceProduct; className?: string }) {
  const image = product.imageUrls[0];
  const healthScore = product.score?.healthScore ?? 0;
  const valueScore = product.score?.valueScore ?? 0;

  return (
    <motion.article whileHover={{ y: -6 }} transition={springSoft} className={cn("group h-full", className)}>
      <Link
        href={`/products/${product.id}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-md"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover transition duration-700 group-hover:scale-[1.03]"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent" />
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/85 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-sm backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden />
            Evidence reviewed
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {product.category}
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-foreground">{product.name}</h2>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-2">
            <ScoreVisual
              label="Evidence"
              score={healthScore}
              highlight={healthScore >= 75}
              variant="mini"
            />
            <ScoreVisual label="Fit" score={valueScore} variant="mini" />
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-4 text-sm font-semibold">
            <span className="tabular-nums text-foreground">{formatCurrency(product.price, product.currency)}</span>
            <span className="inline-flex items-center gap-1 text-accent">
              View evidence
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
