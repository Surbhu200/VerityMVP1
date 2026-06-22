"use client";

import { ClaimExpandableGrid } from "@/components/evidence/claim-expandable";
import { SectionHeader } from "@/components/ui/section-header";
import { MATCH_EXPLANATION } from "@/lib/product-verdict";
import type { MarketplaceProduct } from "@/lib/products";

type ProductClaimsSectionProps = {
  product: MarketplaceProduct;
  className?: string;
};

export function ProductClaimsSection({ product, className }: ProductClaimsSectionProps) {
  return (
    <section className={className}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Quick scan"
          title="Claims you can expand"
          description="Tap a claim to open the cited paper context. Match labels show how directly the study supports the benefit — not medical certainty."
        />
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">{MATCH_EXPLANATION}</p>
        <ClaimExpandableGrid product={product} layoutIdPrefix={`claims-${product.id}`} className="mt-8" />
      </div>
    </section>
  );
}