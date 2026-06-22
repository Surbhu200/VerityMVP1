import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  cleanProductDescription,
  fallbackImage,
  resolveAffiliateProductDraft,
  type ResolvedAffiliateProductDraft
} from "@/lib/amazon";
import { buildBestAvailableLocalEvidenceForProduct } from "@/lib/local-evidence";
import { mockProduct } from "@/lib/mock-data";
import type { MarketplaceIngredient, MarketplaceProduct } from "@/lib/products";

const dataDirectory = path.join(process.cwd(), "data");
const localProductsPath = path.join(dataDirectory, "local-products.json");

type LocalProductsFile = {
  products: MarketplaceProduct[];
};

async function readLocalProductsFile(): Promise<LocalProductsFile> {
  try {
    const raw = await readFile(localProductsPath, "utf8");
    const parsed = JSON.parse(raw) as LocalProductsFile;

    return { products: Array.isArray(parsed.products) ? parsed.products : [] };
  } catch {
    return { products: [] };
  }
}

async function writeLocalProductsFile(file: LocalProductsFile) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(localProductsPath, JSON.stringify(file, null, 2), "utf8");
}

function normalizeIngredients(value: unknown): MarketplaceIngredient[] {
  if (!Array.isArray(value)) return [];

  const ingredients = value
    .map((ingredient) => {
      if (!ingredient || typeof ingredient !== "object") return null;

      const item = ingredient as Record<string, unknown>;
      const amount = Number(item.amount);

      if (!item.name || !Number.isFinite(amount)) return null;

      return {
        name: String(item.name),
        amount,
        unit: String(item.unit ?? "mg"),
        clinicallyEffectiveDose:
          item.clinicallyEffectiveDose == null ? undefined : Number(item.clinicallyEffectiveDose),
        costShare: item.costShare == null ? undefined : Number(item.costShare)
      };
    })
    .filter(Boolean) as MarketplaceIngredient[];

  return ingredients;
}

export async function getLocalProducts() {
  const file = await readLocalProductsFile();
  return file.products;
}

export async function getLocalProduct(id?: string) {
  if (!id) return null;

  const products = await getLocalProducts();
  return products.find((product) => product.id === id) ?? null;
}

export async function deleteLocalProduct(id: string) {
  const file = await readLocalProductsFile();
  const products = file.products.filter((product) => product.id !== id);

  if (products.length === file.products.length) return false;

  await writeLocalProductsFile({ products });
  return true;
}

export async function createLocalProductFromResolvedDraft(
  affiliateLink: string,
  { asin, details }: ResolvedAffiliateProductDraft
) {
  const id = `local-${asin.toLowerCase()}`;
  const imageUrls = details.images?.length ? details.images : [fallbackImage, ...mockProduct.imageUrls].slice(0, 2);
  const ingredients = normalizeIngredients(details.ingredients);
  const name = details.title ?? `Research product ${asin}`;
  const category = details.category ?? "Research Queue";
  const price = typeof details.price === "number" && details.price > 0 ? details.price : null;
  const description =
    cleanProductDescription(details.description, `${name}. Product details are being enriched from the Amazon listing.`) ??
    "Product details are being enriched from the Amazon listing.";
  const evidence = await buildBestAvailableLocalEvidenceForProduct({
    productId: id,
    name,
    brand: details.brand ?? "Amazon product",
    category,
    asin,
    ingredients
  });
  const product: MarketplaceProduct = {
    ...mockProduct,
    id,
    asin,
    name,
    brand: details.brand ?? "Amazon product",
    category,
    price,
    currency: "USD",
    description,
    imageUrls,
    amazonAffiliateLink: affiliateLink,
    ingredients,
    ...evidence
  };

  const file = await readLocalProductsFile();
  const products = [product, ...file.products.filter((item) => item.id !== id)];
  await writeLocalProductsFile({ products });

  return product;
}

export async function createLocalProductFromAffiliateLink(affiliateLink: string) {
  const draft = await resolveAffiliateProductDraft(affiliateLink);
  return createLocalProductFromResolvedDraft(affiliateLink, draft);
}
