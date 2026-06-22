import { ProductStatus } from "@prisma/client";
import { extractAsinFromUrl, normalizeAmazonUrl, resolveShortAmazonLink } from "@/lib/asin";
import { prisma } from "@/lib/prisma";
import { fetchJsonWithRetry } from "@/lib/retry";

export type AmazonProductPayload = {
  title?: string;
  brand?: string;
  price?: number;
  images?: string[];
  description?: string;
  category?: string;
  ingredients?: Array<{
    name: string;
    amount: number;
    unit: string;
    clinicallyEffectiveDose?: number;
    costShare?: number;
  }>;
};

export type ResolvedAffiliateProductDraft = {
  asin: string;
  details: AmazonProductPayload;
  resolvedLink: string;
};

export const fallbackImage =
  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1100&q=80";

function isAmazonLikeUrl(rawUrl: string) {
  try {
    const hostname = new URL(rawUrl).hostname.replace(/^www\./, "");
    return hostname.includes("amazon.") || hostname === "amzn.to" || hostname === "a.co";
  } catch {
    return false;
  }
}

function localAsinFromUrl(rawUrl: string) {
  let hash = 0;

  for (const character of rawUrl) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return `LOCAL${hash.toString(36).toUpperCase().padStart(5, "0").slice(0, 5)}`;
}

function parsePrice(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return parsePrice(record.value ?? record.amount ?? record.price ?? record.raw ?? record.text);
  }
  if (typeof value !== "string") return undefined;

  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const text = value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .join(" ");
      if (text) return text;
    }
  }

  return undefined;
}

export function cleanProductDescription(value?: string | null, fallback?: string) {
  const source = value?.trim() || fallback?.trim() || "";
  if (!source) return null;

  const sourceText = source.toLowerCase();
  const resistance = source.match(/\b\d+\s*kg\s*-\s*\d+\s*kg\b|\b\d+\s*-\s*\d+\s*lbs?\b/i)?.[0];
  if (/grip|hand gripper|forearm|hand exerciser/.test(sourceText)) {
    return [
      "Adjustable hand grip trainer",
      resistance ? `with ${resistance.replace(/\s+/g, " ")} resistance` : "for progressive resistance",
      "built for grip, wrist, and forearm training."
    ].join(" ");
  }

  if (/sleep mask|eye mask|blindfold/.test(sourceText)) {
    return "Comfort-focused sleep mask designed to block light and support a calmer sleep environment.";
  }

  const cleaned = source
    .replace(/About this item/gi, "")
    .replace(/›\s*See more product details/gi, "")
    .replace(/See more product details/gi, "")
    .replace(/\b(PROTABLE|PORTABLE|MULTI-PRUPOSE|MULTI-PURPOSE|HIGH QUALITY|ADJUSTABLE RESISTANCE|COMFORTABLE AND DURABLE):?/gi, ". ")
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .replace(/^\W+/, "")
    .trim();
  const sentences =
    cleaned
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? [];
  const summary = sentences.slice(0, 2).join(" ");
  const compact = summary || cleaned;

  if (compact.length <= 260) return compact;

  const truncated = compact.slice(0, 260).replace(/\s+\S*$/, "").trim();
  return `${truncated}...`;
}

function normalizeImages(value: unknown, fallbackValues: unknown[] = []) {
  const candidates = [value, ...fallbackValues];
  const images: string[] = [];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.startsWith("http")) {
      images.push(candidate);
    }

    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        if (typeof item === "string" && item.startsWith("http")) {
          images.push(item);
        } else if (item && typeof item === "object") {
          const objectItem = item as Record<string, unknown>;
          const image = firstString(objectItem.url, objectItem.image, objectItem.link, objectItem.src);
          if (image?.startsWith("http")) images.push(image);
        }
      }
    }
  }

  return Array.from(new Set(images));
}

function titleCase(value: string) {
  const smallWords = new Set(["and", "or", "for", "the", "with", "of", "in", "a", "an"]);

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && smallWords.has(lower)) return lower;
      if (/^[A-Z0-9]+$/.test(word) && word.length <= 5) return word;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function productSlugFromAmazonUrl(affiliateLink: string, asin: string) {
  try {
    const url = new URL(affiliateLink);
    const parts = url.pathname.split("/").filter(Boolean);
    const asinIndex = parts.findIndex((part) => part.toUpperCase() === asin.toUpperCase());
    const structuralParts = new Set(["dp", "gp", "aw", "d", "product"]);

    if (asinIndex > 0) {
      for (let index = asinIndex - 1; index >= 0; index -= 1) {
        if (!structuralParts.has(parts[index].toLowerCase())) return parts[index];
      }
    }

    if (parts.length > 1 && !structuralParts.has(parts[0].toLowerCase())) return parts[0];
  } catch {
    return null;
  }

  return null;
}

function inferCategoryFromText(text: string) {
  const value = text.toLowerCase();

  if (/sleep|mask|blindfold|pillow|eye/.test(value)) return "Health & Household";
  if (/grip|forearm|fitness|trainer|exercise|sport/.test(value)) return "Sports & Outdoors";
  if (/oil|food|grocery|kitchen|olive|snack|drink/.test(value)) return "Grocery & Gourmet Food";
  if (/skin|hair|beauty|satin|silk/.test(value)) return "Beauty & Personal Care";

  return "Amazon Product";
}

function fallbackProductDetailsFromUrl(asin: string, affiliateLink: string): AmazonProductPayload {
  const slug = productSlugFromAmazonUrl(affiliateLink, asin);
  const readableTitle = slug
    ? titleCase(slug.replace(/[-_+]+/g, " ").replace(/\s+/g, " ").trim())
    : `Amazon product ${asin}`;
  const words = readableTitle.split(/\s+/).filter(Boolean);

  return {
    title: readableTitle,
    brand: words[0] && words[0].toUpperCase() !== asin.toUpperCase() ? words[0] : "Amazon product",
    price: undefined,
    images: [fallbackImage],
    description: slug
      ? cleanProductDescription(`${readableTitle}. Product details are being enriched from the Amazon listing.`) ?? undefined
      : "Product details are being enriched from the Amazon listing.",
    category: inferCategoryFromText(readableTitle),
    ingredients: []
  };
}

function productPayloadFromBrightData(record: Record<string, unknown>): AmazonProductPayload {
  const price = parsePrice(
    record.price ??
      record.final_price ??
      record.sale_price ??
      record.discounted_price ??
      record.price_current ??
      record.price_value ??
      record.initial_price ??
      record.buybox_price ??
      record.current_price ??
      record.list_price
  );
  const images = normalizeImages(record.images, [
    record.image,
    record.image_url,
    record.main_image,
    record.main_image_url,
    record.product_images
  ]);

  return {
    title: firstString(record.title, record.product_title, record.name, record.product_name),
    brand: firstString(record.brand, record.manufacturer, record.seller_name),
    price,
    images: images.length ? images : undefined,
    description: cleanProductDescription(
      firstString(
        record.description,
        record.product_description,
        record.about,
        record.feature_bullets,
        record.bullets,
        record.highlights
      )
    ) ?? undefined,
    category: firstString(record.category, record.category_name, record.department) ?? "Amazon Product",
    ingredients: []
  };
}

function extractBrightDataRecord(payload: unknown): Record<string, unknown> | null {
  if (Array.isArray(payload)) {
    return (payload.find((item) => item && typeof item === "object") as Record<string, unknown> | undefined) ?? null;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return extractBrightDataRecord(record.data);
    if (Array.isArray(record.results)) return extractBrightDataRecord(record.results);
    if (record.title || record.product_title || record.name || record.product_name) return record;
  }

  return null;
}

async function fetchBrightDataSnapshot(snapshotId: string) {
  if (process.env.RESEARCH_TLS_INSECURE === "true") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  const response = await fetch(
    `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
    {
      headers: {
        authorization: `Bearer ${process.env.BRIGHT_DATA_API_KEY}`
      }
    }
  );

  if (response.status === 202 || response.status === 204) return null;
  if (!response.ok) throw new Error(`Bright Data snapshot returned ${response.status}`);

  const payload = (await response.json()) as unknown;
  return extractBrightDataRecord(payload);
}

async function fetchBrightDataAmazonProductDetails(affiliateLink: string) {
  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  if (!apiKey) return null;

  if (process.env.RESEARCH_TLS_INSECURE === "true") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  const datasetId = process.env.BRIGHT_DATA_AMAZON_DATASET_ID || "gd_l7q7dkf244hwjntr0";
  const timeoutMs = Number(process.env.BRIGHT_DATA_SYNC_TIMEOUT_MS ?? 60000);
  const triggerUrl = new URL("https://api.brightdata.com/datasets/v3/trigger");
  triggerUrl.searchParams.set("dataset_id", datasetId);
  triggerUrl.searchParams.set("include_errors", "true");

  const triggerResponse = await fetch(triggerUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify([{ url: affiliateLink }])
  });

  if (!triggerResponse.ok) {
    throw new Error(`Bright Data trigger returned ${triggerResponse.status}`);
  }

  const triggerPayload = (await triggerResponse.json()) as { snapshot_id?: string; snapshotId?: string };
  const snapshotId = triggerPayload.snapshot_id ?? triggerPayload.snapshotId;

  if (!snapshotId) return null;

  const deadline = Date.now() + Math.max(2500, timeoutMs);

  while (Date.now() < deadline) {
    const record = await fetchBrightDataSnapshot(snapshotId);
    if (record) return productPayloadFromBrightData(record);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return null;
}

export async function resolveAffiliateProductDraft(affiliateLink: string): Promise<ResolvedAffiliateProductDraft> {
  const normalizedAffiliateLink = normalizeAmazonUrl(affiliateLink);
  let resolvedLink = normalizedAffiliateLink;

  try {
    resolvedLink = await resolveShortAmazonLink(normalizedAffiliateLink);
  } catch {
    resolvedLink = normalizedAffiliateLink;
  }

  const asin =
    extractAsinFromUrl(resolvedLink) ??
    extractAsinFromUrl(normalizedAffiliateLink) ??
    (isAmazonLikeUrl(normalizedAffiliateLink) ? localAsinFromUrl(normalizedAffiliateLink) : null);

  if (!asin) {
    throw new Error("Enter an Amazon product URL or affiliate link.");
  }

  const details = await fetchAmazonProductDetails(asin, resolvedLink);

  return { asin, details, resolvedLink };
}

export async function fetchAmazonProductDetails(asin: string, affiliateLink: string) {
  const endpoint = process.env.AMAZON_PRODUCT_API_ENDPOINT;

  try {
    const brightDataDetails = await fetchBrightDataAmazonProductDetails(affiliateLink);
    if (brightDataDetails?.title || brightDataDetails?.images?.length || brightDataDetails?.price) {
      return {
        title: brightDataDetails.title ?? `Research product ${asin}`,
        brand: brightDataDetails.brand ?? "Amazon",
        price: brightDataDetails.price,
        images: brightDataDetails.images?.length ? brightDataDetails.images : [fallbackImage],
        description:
          brightDataDetails.description ??
          "Product details were pulled from the configured Bright Data Amazon scraper.",
        category: brightDataDetails.category ?? "Amazon Product",
        ingredients: brightDataDetails.ingredients ?? []
      } satisfies AmazonProductPayload;
    }
  } catch (error) {
    console.warn(error);
  }

  if (!endpoint) {
    return fallbackProductDetailsFromUrl(asin, affiliateLink);
  }

  return fetchJsonWithRetry<AmazonProductPayload>(
    "Amazon product data provider",
    endpoint,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.AMAZON_PRODUCT_API_KEY
          ? { authorization: `Bearer ${process.env.AMAZON_PRODUCT_API_KEY}` }
          : {})
      },
      body: JSON.stringify({ asin, affiliateLink })
    },
    { retries: 3 }
  );
}

export async function ingestAffiliateLink(affiliateLink: string) {
  const draft = await resolveAffiliateProductDraft(affiliateLink);

  return saveResolvedAffiliateProductToDatabase(affiliateLink, draft);
}

export async function saveResolvedAffiliateProductToDatabase(
  affiliateLink: string,
  { asin, details }: ResolvedAffiliateProductDraft
) {
  return prisma.product.upsert({
    where: { asin },
    update: {
      name: details.title ?? `Amazon product ${asin}`,
      brand: details.brand,
      category: details.category ?? "Uncategorized",
      price: details.price ?? undefined,
      imageUrls: details.images?.length ? details.images : [fallbackImage],
      description: details.description,
      ingredients: details.ingredients ?? [],
      amazonAffiliateLink: affiliateLink,
      status: ProductStatus.RESEARCHING
    },
    create: {
      asin,
      name: details.title ?? `Amazon product ${asin}`,
      brand: details.brand,
      category: details.category ?? "Uncategorized",
      price: details.price ?? undefined,
      imageUrls: details.images?.length ? details.images : [fallbackImage],
      description: details.description,
      ingredients: details.ingredients ?? [],
      amazonAffiliateLink: affiliateLink,
      status: ProductStatus.RESEARCHING
    }
  });
}
