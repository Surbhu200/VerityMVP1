import type { StudyType } from "@prisma/client";
import { clamp, gradeFromScore } from "@/lib/utils";

export type EvidenceInput = {
  studyType: StudyType | string;
  sampleSize?: number | null;
  citationCount?: number | null;
  publicationYear?: number | null;
  matchConfidence?: number | null;
  title?: string | null;
  summary?: string | null;
};

export type IngredientInput = {
  name: string;
  amount: number;
  unit: string;
  clinicallyEffectiveDose?: number;
  costShare?: number;
};

export type ProductScoreContext = {
  name: string;
  category: string;
  description?: string | null;
  price?: number | null;
  ingredients?: IngredientInput[];
  productKind?: "supplement" | "equipment" | "general";
  benefitConfidence?: number;
};

const STUDY_WEIGHTS: Record<string, number> = {
  META_ANALYSIS: 1,
  SYSTEMATIC_REVIEW: 0.92,
  RANDOMIZED_CONTROLLED_TRIAL: 0.88,
  COHORT: 0.62,
  OBSERVATIONAL: 0.5,
  CASE_STUDY: 0.28,
  IN_VITRO: 0.18,
  OTHER: 0.2
};

function contextText(context: ProductScoreContext) {
  return `${context.name} ${context.category} ${context.description ?? ""} ${
    context.ingredients?.map((ingredient) => ingredient.name).join(" ") ?? ""
  }`.toLowerCase();
}

function evidenceText(evidence: EvidenceInput) {
  return `${evidence.title ?? ""} ${evidence.summary ?? ""}`.toLowerCase();
}

function isOliveOilProduct(context: ProductScoreContext) {
  return /extra virgin|evoo|olive oil|polyphenol/.test(contextText(context));
}

function productQualityScore(context: ProductScoreContext) {
  const text = contextText(context);
  let score = 48;

  if (isOliveOilProduct(context)) {
    score = 56;
    if (/extra virgin|evoo/.test(text)) score += 12;
    if (/polyphenol/.test(text)) score += 10;
    const polyphenol = text.match(/(\d{2,4})\+?\s*mg\/kg/);
    if (polyphenol) {
      const value = Number(polyphenol[1]);
      if (value >= 400) score += 14;
      else if (value >= 250) score += 9;
      else if (value >= 150) score += 5;
    }
    if (/early harvest/.test(text)) score += 6;
    if (/first cold press|cold pressed/.test(text)) score += 6;
    if (/glass/.test(text)) score += 3;
    if (/non-gmo|organic|keto|paleo/.test(text)) score += 2;
    return Math.round(clamp(score, 0, 98));
  }

  if (context.productKind === "equipment") {
    if (/adjustable|resistance|ergonomic|portable|durable/.test(text)) score += 16;
    if (/safety|comfort|fit|setup/.test(text)) score += 8;
    return Math.round(clamp(score, 0, 88));
  }

  if (context.ingredients?.length) {
    score = 54;
    const doseSignals = context.ingredients.filter((ingredient) => {
      const target = ingredient.clinicallyEffectiveDose ?? ingredient.amount;
      return target > 0 && ingredient.amount / target >= 0.75;
    }).length;
    score += Math.min(22, doseSignals * 8);
    if (/third party|tested|non-gmo|vegan|organic/.test(text)) score += 6;
    return Math.round(clamp(score, 0, 90));
  }

  return Math.round(clamp(score, 0, 82));
}

function outcomeTerms(context: ProductScoreContext) {
  const text = contextText(context);

  if (isOliveOilProduct(context)) {
    return [
      "extra virgin olive oil",
      "olive oil",
      "polyphenol",
      "phenolic",
      "cardiovascular",
      "metabolic",
      "inflammation",
      "oxidative",
      "mediterranean",
      "longevity",
      "healthy aging"
    ];
  }

  if (/grip|forearm|wrist|hand/.test(text)) {
    return ["grip", "handgrip", "hand function", "older adult", "aging", "mobility", "frailty", "function"];
  }

  if (/sleep mask|eye mask|blindfold/.test(text)) {
    return ["sleep quality", "eye mask", "sleep mask", "light", "circadian", "insomnia"];
  }

  if (/sleep|insomnia/.test(text)) {
    return ["sleep", "sleep quality", "sleep latency", "insomnia", "safety"];
  }

  return ["systematic review", "clinical trial", "safety", "quality of life", "function", "healthy aging"];
}

function outcomeRelevance(context: ProductScoreContext, evidence: EvidenceInput) {
  const haystack = evidenceText(evidence);
  const terms = outcomeTerms(context);
  const hits = terms.filter((term) => haystack.includes(term)).length;
  return clamp(hits / Math.min(4, terms.length), 0, 1);
}

function articleDecisionScore(article: EvidenceInput, context: ProductScoreContext) {
  const studyWeight = STUDY_WEIGHTS[String(article.studyType)] ?? STUDY_WEIGHTS.OTHER;
  const sampleScore = clamp(Math.log10((article.sampleSize ?? 0) + 1) / 4, 0, 1);
  const citationScore = clamp(Math.log10((article.citationCount ?? 0) + 1) / 3, 0, 1);
  const confidence = clamp(article.matchConfidence ?? 0.5, 0, 1);
  const recency =
    article.publicationYear == null
      ? 0.56
      : clamp(1 - Math.max(0, new Date().getFullYear() - article.publicationYear) / 18, 0.38, 1);
  const outcome = outcomeRelevance(context, article);

  return studyWeight * 30 + confidence * 24 + outcome * 24 + recency * 10 + citationScore * 7 + sampleScore * 5;
}

export function calculateHealthScore(evidence: EvidenceInput[]) {
  if (!evidence.length) {
    return {
      score: 0,
      grade: "Limited",
      explanation: "No verified evidence has been linked to this product yet."
    };
  }

  const topFive = evidence.slice(0, 5);
  const weighted = topFive.map((article, index) => {
    const studyWeight = STUDY_WEIGHTS[String(article.studyType)] ?? STUDY_WEIGHTS.OTHER;
    const sampleScore = clamp(Math.log10((article.sampleSize ?? 0) + 1) / 4, 0, 1);
    const citationScore = clamp(Math.log10((article.citationCount ?? 0) + 1) / 3, 0, 1);
    const confidence = clamp(article.matchConfidence ?? 0.5, 0, 1);
    const recency =
      article.publicationYear == null
        ? 0.55
        : clamp(1 - Math.max(0, new Date().getFullYear() - article.publicationYear) / 20, 0.35, 1);
    const rankWeight = [1, 0.92, 0.84, 0.74, 0.66][index] ?? 0.6;

    return (
      (studyWeight * 0.46 + sampleScore * 0.18 + citationScore * 0.12 + confidence * 0.16 + recency * 0.08) *
      rankWeight
    );
  });

  const maxWeight = topFive.reduce((sum, _article, index) => sum + ([1, 0.92, 0.84, 0.74, 0.66][index] ?? 0.6), 0);
  const score = Math.round(clamp((weighted.reduce((sum, item) => sum + item, 0) / maxWeight) * 100, 0, 100));

  return {
    score,
    grade: gradeFromScore(score),
    explanation:
      "Weighted by evidence hierarchy, sample size, citation signal, recency, and product-match confidence across the top five papers."
  };
}

export function calculateValueScore(price: number | null | undefined, ingredients: IngredientInput[]) {
  if (!price || price <= 0 || !ingredients.length) {
    return {
      score: 0,
      grade: "Limited",
      explanation: "Value cannot be calculated until price and dosage data are available."
    };
  }

  const doseCoverage = ingredients.map((ingredient) => {
    const clinicallyEffectiveDose = ingredient.clinicallyEffectiveDose ?? ingredient.amount;
    const coverage = clinicallyEffectiveDose > 0 ? ingredient.amount / clinicallyEffectiveDose : 0;
    const share = ingredient.costShare ?? 1 / ingredients.length;

    return clamp(coverage, 0, 1.35) * share;
  });

  const servingEffectiveness = clamp(doseCoverage.reduce((sum, item) => sum + item, 0), 0, 1.35);
  const costPerEffectiveServing = price / Math.max(servingEffectiveness, 0.2);
  const affordabilityCurve = 100 / (1 + Math.exp((costPerEffectiveServing - 34) / 9));
  const score = Math.round(clamp(affordabilityCurve + servingEffectiveness * 12, 0, 100));

  return {
    score,
    grade: gradeFromScore(score),
    explanation:
      "Compares price against dose coverage for clinically relevant ingredient amounts, then normalizes affordability on a 0-100 scale."
  };
}

function volumeLitersFromText(text: string) {
  const ml = text.match(/(\d+)\s*(?:x|pack|-pack|pack of)?\s*(\d{3,4})\s*ml/i);
  if (ml) return (Number(ml[1]) * Number(ml[2])) / 1000;

  const simpleMl = text.match(/(\d{3,4})\s*ml/i);
  if (simpleMl) return Number(simpleMl[1]) / 1000;

  return null;
}

function priceAccessibilityScore(context: ProductScoreContext) {
  if (!context.price || context.price <= 0) return 58;

  const text = contextText(context);
  if (isOliveOilProduct(context)) {
    const liters = volumeLitersFromText(text) ?? 0.75;
    const pricePerLiter = context.price / Math.max(liters, 0.25);

    if (pricePerLiter <= 35) return 95;
    if (pricePerLiter <= 50) return 88;
    if (pricePerLiter <= 70) return 78;
    if (pricePerLiter <= 95) return 68;
    return 56;
  }

  if (context.productKind === "equipment") {
    if (context.price <= 15) return 90;
    if (context.price <= 30) return 82;
    if (context.price <= 60) return 72;
    return 60;
  }

  return calculateValueScore(context.price, context.ingredients ?? []).score || 58;
}

export function calculateBenefitScore(evidence: EvidenceInput[], context: ProductScoreContext) {
  if (!evidence.length) {
    return {
      score: 0,
      grade: "Limited",
      explanation: "No verified evidence has been linked to this product yet."
    };
  }

  const topFive = evidence.slice(0, 5);
  const rankWeights = [1, 0.94, 0.86, 0.76, 0.68];
  const totalWeight = topFive.reduce((sum, _article, index) => sum + (rankWeights[index] ?? 0.6), 0);
  const evidenceScore =
    topFive.reduce(
      (sum, article, index) => sum + articleDecisionScore(article, context) * (rankWeights[index] ?? 0.6),
      0
    ) / totalWeight;
  const quality = productQualityScore(context);
  const benefitConfidence = clamp(context.benefitConfidence ?? 0.72, 0, 1) * 100;
  let score = Math.round(evidenceScore * 0.72 + quality * 0.2 + benefitConfidence * 0.08);

  if (isOliveOilProduct(context) && quality >= 88 && evidenceScore >= 48) {
    score = Math.max(score, 88);
  }

  if (isOliveOilProduct(context) && quality >= 94 && evidenceScore >= 55) {
    score = Math.max(score, 91);
  }

  return {
    score: Math.round(clamp(score, 0, 100)),
    grade: gradeFromScore(score),
    explanation:
      "Benefit Score combines study quality, product-match confidence, outcome relevance, recency, and product-specific quality signals."
  };
}

export function calculateProductFitScore(
  context: ProductScoreContext,
  benefitScore: number,
  fallbackValue?: ReturnType<typeof calculateValueScore>
) {
  const quality = productQualityScore(context);
  const price = priceAccessibilityScore(context);
  let score: number;

  if (isOliveOilProduct(context)) {
    score = quality * 0.44 + benefitScore * 0.34 + price * 0.22;
  } else if (context.ingredients?.length) {
    const value = fallbackValue ?? calculateValueScore(context.price, context.ingredients);
    score = benefitScore * 0.42 + quality * 0.28 + (value.score || price) * 0.3;
  } else {
    score = benefitScore * 0.48 + quality * 0.32 + price * 0.2;
  }

  const rounded = Math.round(clamp(score, 0, 100));

  return {
    score: rounded,
    grade: gradeFromScore(rounded),
    explanation:
      "Product Fit Score combines evidence-backed benefit, product quality signals, practical use fit, and price context when available."
  };
}
