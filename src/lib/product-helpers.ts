import type { MarketplaceProduct } from "@/lib/products";

export function studyLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function productKind(product: MarketplaceProduct) {
  if (product.productKind) return product.productKind;

  const text = `${product.name} ${product.category}`.toLowerCase();
  if (
    !product.ingredients.length &&
    ["grip", "forearm", "wrist", "trainer", "hand exerciser", "device", "tool"].some((term) =>
      text.includes(term)
    )
  ) {
    return "equipment";
  }

  return product.ingredients.length ? "supplement" : "general";
}

export function paperForBenefit(product: MarketplaceProduct, articleId?: string | null) {
  if (!articleId) return null;
  return product.research.find((paper) => paper.id === articleId) ?? null;
}