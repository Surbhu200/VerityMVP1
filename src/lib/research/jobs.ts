import { EventEmitter } from "node:events";
import {
  Prisma,
  ProductStatus,
  ResearchJobStatus,
  ResearchSource,
  StudyType,
  type Product
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calculateBenefitScore,
  calculateProductFitScore,
  calculateValueScore,
  type IngredientInput
} from "@/lib/scoring";
import { discoverCandidateArticles } from "@/lib/research/apis";
import { curateTopEvidence } from "@/lib/research/curation";
import type { CuratedPaper } from "@/lib/research/types";

function toNumber(value: unknown) {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIngredients(value: unknown): IngredientInput[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((ingredient) => {
      if (!ingredient || typeof ingredient !== "object") return null;

      const item = ingredient as Record<string, unknown>;
      const amount = toNumber(item.amount);
      const clinicallyEffectiveDose = toNumber(item.clinicallyEffectiveDose);
      const costShare = toNumber(item.costShare);

      if (!item.name || amount == null) return null;

      return {
        name: String(item.name),
        amount,
        unit: String(item.unit ?? "mg"),
        clinicallyEffectiveDose: clinicallyEffectiveDose ?? undefined,
        costShare: costShare ?? undefined
      } satisfies IngredientInput;
    })
    .filter(Boolean) as IngredientInput[];
}

function normalizeDoi(doi?: string | null) {
  return doi?.replace(/^https?:\/\/doi\.org\//i, "").trim().toLowerCase() ?? null;
}

function safeStudyType(value: string): StudyType {
  return Object.values(StudyType).includes(value as StudyType) ? (value as StudyType) : StudyType.OTHER;
}

function safeSource(value: string): ResearchSource {
  return Object.values(ResearchSource).includes(value as ResearchSource)
    ? (value as ResearchSource)
    : ResearchSource.MANUAL;
}

async function saveCuratedResearch(product: Product, curated: Awaited<ReturnType<typeof curateTopEvidence>>) {
  const price = product.price == null ? null : Number(product.price);
  const ingredients = parseIngredients(product.ingredients);
  const evidenceInputs = curated.papers.map((paper) => ({
    studyType: paper.studyType,
    sampleSize: paper.sampleSize,
    citationCount: paper.citationCount,
    publicationYear: paper.publicationYear,
    matchConfidence: paper.matchConfidence,
    title: paper.title,
    summary: `${paper.summary} ${paper.efficacy} ${paper.limitations}`
  }));
  const averageBenefitConfidence = curated.benefits.length
    ? curated.benefits.reduce((sum, benefit) => sum + benefit.confidence, 0) / curated.benefits.length
    : 0.62;
  const context = {
    name: product.name,
    category: product.category,
    description: product.description,
    price,
    ingredients,
    productKind: ingredients.length ? ("supplement" as const) : ("general" as const),
    benefitConfidence: averageBenefitConfidence
  };
  const health = calculateBenefitScore(evidenceInputs, context);
  const value = calculateProductFitScore(context, health.score, calculateValueScore(price, ingredients));

  await prisma.$transaction(async (tx) => {
    await tx.productResearch.deleteMany({ where: { productId: product.id } });
    await tx.productBenefit.deleteMany({ where: { productId: product.id } });
    await tx.aiSummary.deleteMany({ where: { productId: product.id } });
    await tx.productScore.deleteMany({ where: { productId: product.id } });

    const articleByDoi = new Map<string, string>();
    const articleByTitle = new Map<string, string>();

    for (const paper of curated.papers) {
      const article = await upsertArticle(tx, paper);
      const doi = normalizeDoi(paper.doi);

      if (doi) articleByDoi.set(doi, article.id);
      articleByTitle.set(paper.title.toLowerCase(), article.id);

      await tx.productResearch.create({
        data: {
          productId: product.id,
          articleId: article.id,
          matchConfidence: paper.matchConfidence,
          rank: paper.rank,
          rationale: paper.rationale
        }
      });

      await tx.aiSummary.create({
        data: {
          productId: product.id,
          articleId: article.id,
          summary: paper.summary,
          efficacy: paper.efficacy,
          sideEffects: paper.sideEffects,
          dosage: paper.dosage,
          limitations: paper.limitations,
          model: curated.model
        }
      });
    }

    const firstArticleId =
      articleByDoi.get(normalizeDoi(curated.papers[0]?.doi) ?? "") ??
      articleByTitle.get(curated.papers[0]?.title?.toLowerCase() ?? "");

    for (const [index, benefit] of curated.benefits.entries()) {
      const articleId =
        articleByDoi.get(normalizeDoi(benefit.articleDoi) ?? "") ??
        (benefit.articleTitle ? articleByTitle.get(benefit.articleTitle.toLowerCase()) : undefined) ??
        firstArticleId;

      await tx.productBenefit.create({
        data: {
          productId: product.id,
          verifiedByArticleId: articleId,
          claim: benefit.claim,
          confidence: benefit.confidence,
          displayOrder: index + 1
        }
      });
    }

    await tx.productScore.create({
      data: {
        productId: product.id,
        healthScore: health.score,
        valueScore: value.score,
        evidenceGrade: health.grade,
        valueGrade: value.grade,
        explanation: `${health.explanation} ${value.explanation}`
      }
    });

    await tx.product.update({
      where: { id: product.id },
      data: { status: ProductStatus.PUBLISHED }
    });
  });
}

async function upsertArticle(tx: Prisma.TransactionClient, paper: CuratedPaper) {
  const data = {
    title: paper.title,
    authors: paper.authors,
    journal: paper.journal,
    publicationYear: paper.publicationYear,
    studyType: safeStudyType(String(paper.studyType)),
    sampleSize: paper.sampleSize,
    citationCount: paper.citationCount ?? 0,
    url: paper.url,
    source: safeSource(String(paper.source))
  };

  const doi = normalizeDoi(paper.doi);

  if (!doi) {
    return tx.researchArticle.create({ data });
  }

  return tx.researchArticle.upsert({
    where: { doi },
    update: data,
    create: {
      doi,
      ...data
    }
  });
}

export async function processResearchJob(jobId: string) {
  const job = await prisma.researchJob.update({
    where: { id: jobId },
    data: {
      status: ResearchJobStatus.PROCESSING,
      attempts: { increment: 1 },
      startedAt: new Date(),
      message: "Gathering research candidates."
    }
  });

  try {
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: job.productId }
    });

    const candidates = await discoverCandidateArticles({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
      ingredients: product.ingredients,
      price: product.price == null ? null : Number(product.price)
    });

    await prisma.researchJob.update({
      where: { id: jobId },
      data: { message: `Curating ${candidates.length} research candidate(s).` }
    });

    const curated = await curateTopEvidence(
      {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        description: product.description,
        ingredients: product.ingredients,
        price: product.price == null ? null : Number(product.price)
      },
      candidates
    );

    await saveCuratedResearch(product, curated);

    await prisma.researchJob.update({
      where: { id: jobId },
      data: {
        status: ResearchJobStatus.COMPLETED,
        completedAt: new Date(),
        message: "Research pipeline completed."
      }
    });
  } catch (error) {
    console.error(error);
    await prisma.researchJob.update({
      where: { id: jobId },
      data: {
        status: ResearchJobStatus.FAILED,
        failedAt: new Date(),
        message: error instanceof Error ? error.message : "Research pipeline failed."
      }
    });
  }
}

class ResearchJobQueue extends EventEmitter {
  async enqueue(productId: string) {
    const job = await prisma.researchJob.create({
      data: {
        productId,
        status: ResearchJobStatus.PENDING,
        message: "Processing started."
      }
    });

    setTimeout(() => this.emit("process", job.id), 0);

    return job;
  }
}

const globalForQueue = globalThis as unknown as {
  researchJobQueue?: ResearchJobQueue;
  researchJobQueueBooted?: boolean;
};

export const researchJobQueue = globalForQueue.researchJobQueue ?? new ResearchJobQueue();

if (!globalForQueue.researchJobQueueBooted) {
  researchJobQueue.on("process", (jobId: string) => {
    void processResearchJob(jobId);
  });
  globalForQueue.researchJobQueueBooted = true;
}

globalForQueue.researchJobQueue = researchJobQueue;
