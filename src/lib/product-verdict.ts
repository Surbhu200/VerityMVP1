import type { MarketplaceProduct } from "@/lib/products";

export const MATCH_EXPLANATION =
  "Claim match reflects how closely a specific paper supports this benefit — not AI confidence or medical certainty.";

export const PAPER_MATCH_EXPLANATION =
  "Product relevance reflects how closely the studied protocol, population, and dose match this listing.";

export function claimMatchLabel(confidence: number) {
  return `${Math.round(confidence * 100)}% claim match`;
}

export function paperMatchLabel(confidence: number) {
  return `${Math.round(confidence * 100)}% relevance`;
}

export function getProductVerdict(product: MarketplaceProduct) {
  const health = product.score?.healthScore ?? 0;
  const value = product.score?.valueScore ?? 0;
  const grade = product.score?.evidenceGrade ?? "Limited";
  const topClaim = product.benefits[0]?.claim;

  const headline =
    health >= 75
      ? `Strong evidence (${grade}) for ${product.category.toLowerCase()} — worth a closer look if this fits your goals.`
      : health >= 60
        ? `Moderate evidence (${grade}) — promising research, but read the caveats before buying.`
        : `Limited evidence (${grade}) — treat claims cautiously and review sources directly.`;

  const goodFor =
    product.bestFor?.[0] ??
    (topClaim
      ? `Shoppers evaluating "${topClaim.slice(0, 80)}${topClaim.length > 80 ? "…" : ""}"`
      : `People comparing ${product.category.toLowerCase()} products with cited research.`);

  const caveat =
    value < 65
      ? "Product fit is weaker — dose, price, or practical use may not align with what studies tested."
      : "Individual results vary. Summaries are educational — not medical advice.";

  return { headline, goodFor, caveat };
}