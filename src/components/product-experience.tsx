"use client";

import { LayoutGroup } from "framer-motion";
import { EvidenceDeepDive } from "@/components/evidence/evidence-deep-dive";
import { ProductClaimsSection } from "@/components/product/product-claims-section";
import { ProductHero } from "@/components/product/product-hero";
import type { MarketplaceProduct } from "@/lib/products";

export function ProductExperience({ product }: { product: MarketplaceProduct }) {
  return (
    <LayoutGroup id={`product-${product.id}`}>
      <main className="bg-background pb-24">
        <ProductHero product={product} />
        <ProductClaimsSection product={product} className="border-b border-border/50 bg-muted/20" />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <EvidenceDeepDive product={product} />
        </div>
      </main>
    </LayoutGroup>
  );
}
