import { mockProduct } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { getLocalProduct, getLocalProducts } from "@/lib/local-products";
import { cleanProductDescription } from "@/lib/amazon";

export type MarketplaceIngredient = {
  name: string;
  amount: number;
  unit: string;
  clinicallyEffectiveDose?: number;
  costShare?: number;
};

export type MarketplaceProduct = {
  id: string;
  name: string;
  brand?: string | null;
  category: string;
  productKind?: "supplement" | "equipment" | "general";
  price?: number | null;
  currency: string;
  description?: string | null;
  imageUrls: string[];
  asin?: string | null;
  amazonAffiliateLink: string;
  ingredients: MarketplaceIngredient[];
  bestFor?: string[];
  score?: {
    healthScore: number;
    valueScore: number;
    evidenceGrade: string;
    valueGrade: string;
    explanation: string;
  } | null;
  benefits: Array<{
    id: string;
    claim: string;
    confidence: number;
    articleId?: string | null;
    articleRank?: number | null;
  }>;
  research: Array<{
    id: string;
    rank: number;
    matchConfidence: number;
    rationale?: string | null;
    article: {
      id: string;
      doi?: string | null;
      title: string;
      authors: string[];
      journal?: string | null;
      publicationYear?: number | null;
      studyType: string;
      sampleSize?: number | null;
      citationCount: number;
      url?: string | null;
    };
    summary?: {
      summary: string;
      efficacy: string;
      sideEffects: string;
      dosage: string;
      limitations: string;
    } | null;
  }>;
};

function parseIngredients(value: unknown): MarketplaceIngredient[] {
  if (!Array.isArray(value)) return [];

  return value
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
}

function safeResearchUrl(url: string | null | undefined, title: string) {
  if (!url || url.includes("doi.org/10.0000")) {
    return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(title)}`;
  }

  return url;
}

type PrismaProductPayload = Awaited<ReturnType<typeof fetchProductRecord>>;

async function fetchProductRecord(id?: string) {
  if (id) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        score: true,
        benefits: { orderBy: { displayOrder: "asc" } },
        aiSummaries: true,
        researchLinks: {
          orderBy: { rank: "asc" },
          include: { article: true }
        }
      }
    });
  }

  return prisma.product.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    include: {
      score: true,
      benefits: { orderBy: { displayOrder: "asc" } },
      aiSummaries: true,
      researchLinks: {
        orderBy: { rank: "asc" },
        include: { article: true }
      }
    }
  });
}

function toMarketplaceProduct(product: NonNullable<PrismaProductPayload>): MarketplaceProduct {
  const summariesByArticle = new Map(product.aiSummaries.map((summary) => [summary.articleId, summary]));
  const rankByArticle = new Map(product.researchLinks.map((link) => [link.articleId, link.rank]));

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price == null || Number(product.price) <= 0 ? null : Number(product.price),
    currency: product.currency,
    description: cleanProductDescription(product.description, product.name),
    imageUrls: product.imageUrls,
    asin: product.asin,
    amazonAffiliateLink: product.amazonAffiliateLink,
    ingredients: parseIngredients(product.ingredients),
    score: product.score
      ? {
          healthScore: product.score.healthScore,
          valueScore: product.score.valueScore,
          evidenceGrade: product.score.evidenceGrade,
          valueGrade: product.score.valueGrade,
          explanation: product.score.explanation
        }
      : null,
    benefits: product.benefits.map((benefit) => ({
      id: benefit.id,
      claim: benefit.claim,
      confidence: benefit.confidence,
      articleId: benefit.verifiedByArticleId,
      articleRank: benefit.verifiedByArticleId ? rankByArticle.get(benefit.verifiedByArticleId) : null
    })),
    research: product.researchLinks.map((link) => {
      const summary = summariesByArticle.get(link.articleId);

      return {
        id: link.articleId,
        rank: link.rank,
        matchConfidence: link.matchConfidence,
        rationale: link.rationale,
        article: {
          id: link.article.id,
          doi: link.article.doi,
          title: link.article.title,
          authors: link.article.authors,
          journal: link.article.journal,
          publicationYear: link.article.publicationYear,
          studyType: link.article.studyType,
          sampleSize: link.article.sampleSize,
          citationCount: link.article.citationCount,
          url: safeResearchUrl(link.article.url, link.article.title)
        },
        summary: summary
          ? {
              summary: summary.summary,
              efficacy: summary.efficacy,
              sideEffects: summary.sideEffects,
              dosage: summary.dosage,
              limitations: summary.limitations
            }
          : null
      };
    })
  };
}

export async function getFeaturedProducts() {
  const localProducts = await getLocalProducts();

  if (!process.env.DATABASE_URL) return localProducts.length ? localProducts : [mockProduct];

  try {
    const records = await prisma.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        score: true,
        benefits: { orderBy: { displayOrder: "asc" } },
        aiSummaries: true,
        researchLinks: {
          orderBy: { rank: "asc" },
          include: { article: true }
        }
      }
    });

    if (records.length) return [...localProducts, ...records.map(toMarketplaceProduct)];
  } catch {
    return localProducts.length ? localProducts : [mockProduct];
  }

  return localProducts.length ? localProducts : [mockProduct];
}

export async function getAdminProducts() {
  const localProducts = await getLocalProducts();

  if (!process.env.DATABASE_URL) return localProducts;

  try {
    const records = await prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        score: true,
        benefits: { orderBy: { displayOrder: "asc" } },
        aiSummaries: true,
        researchLinks: {
          orderBy: { rank: "asc" },
          include: { article: true }
        }
      }
    });

    return [...localProducts, ...records.map(toMarketplaceProduct)];
  } catch {
    return localProducts;
  }
}

export async function getProduct(id?: string) {
  if (id === mockProduct.id) return mockProduct;

  const localProduct = await getLocalProduct(id);
  if (localProduct) return localProduct;

  if (!process.env.DATABASE_URL) return mockProduct;

  try {
    const product = await fetchProductRecord(id);
    if (product) return toMarketplaceProduct(product);
  } catch {
    return localProduct ?? mockProduct;
  }

  return mockProduct;
}
