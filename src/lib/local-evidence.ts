import type { MarketplaceIngredient, MarketplaceProduct } from "@/lib/products";
import { discoverCandidateArticles } from "@/lib/research/apis";
import { curateTopEvidence } from "@/lib/research/curation";
import type { CuratedResearchResult } from "@/lib/research/types";
import { calculateBenefitScore, calculateProductFitScore, calculateValueScore } from "@/lib/scoring";

type LocalEvidenceInput = {
  productId: string;
  name: string;
  brand?: string | null;
  category: string;
  asin?: string | null;
  ingredients: MarketplaceIngredient[];
};

function detectProductKind(input: Pick<LocalEvidenceInput, "name" | "category" | "ingredients">) {
  const text = `${input.name} ${input.category}`.toLowerCase();
  const equipmentTerms = [
    "grip",
    "forearm",
    "wrist",
    "hand exerciser",
    "trainer",
    "resistance band",
    "dumbbell",
    "kettlebell",
    "massager",
    "brace",
    "splint",
    "wrap",
    "device",
    "tool",
    "cold plunge",
    "ice bath",
    "plunge tub",
    "recovery tub",
    "cold therapy",
    "cryotherapy"
  ];

  if (!input.ingredients.length && equipmentTerms.some((term) => text.includes(term))) return "equipment" as const;
  if (input.ingredients.length) return "supplement" as const;
  return "general" as const;
}

function benefitConfidenceAverage(benefits: MarketplaceProduct["benefits"]) {
  if (!benefits.length) return 0.62;
  return benefits.reduce((sum, benefit) => sum + benefit.confidence, 0) / benefits.length;
}

function encodeSearch(value: string) {
  return encodeURIComponent(value.replace(/\s+/g, " ").trim());
}

function ingredientNames(ingredients: MarketplaceIngredient[]) {
  return ingredients.map((ingredient) => ingredient.name).filter(Boolean);
}

function productQuery(input: LocalEvidenceInput) {
  const ingredients = ingredientNames(input.ingredients);
  return [input.name, ...ingredients].join(" ").trim();
}

function makeResearchItem(
  input: LocalEvidenceInput,
  rank: number,
  title: string,
  url: string,
  summary: string,
  focus: string
): MarketplaceProduct["research"][number] {
  const id = `${input.productId}-research-${rank}`;
  const productKind = detectProductKind(input);

  return {
    id,
    rank,
    matchConfidence: Math.max(0.32, 0.58 - rank * 0.035),
    rationale: `Queued because it can help validate ${focus.toLowerCase()} for ${input.name}.`,
    article: {
      id,
      doi: null,
      title,
      authors: ["Automated Research Queue"],
      journal: "Live evidence discovery",
      publicationYear: new Date().getFullYear(),
      studyType: "OTHER",
      sampleSize: null,
      citationCount: 0,
      url
    },
    summary: {
      summary,
      dosage:
        input.ingredients.length > 0
          ? `Detected label ingredients: ${input.ingredients
              .map((ingredient) => `${ingredient.amount}${ingredient.unit} ${ingredient.name}`)
              .join(", ")}. Dose relevance still needs literature review.`
          : "Product setup, fit, resistance level, testing protocol, and intended use have not been reviewed yet.",
      efficacy:
        productKind === "supplement"
          ? "No consumer benefit claim is marked verified until research candidates are curated and tied to this product's ingredients."
          : "No consumer benefit claim is marked verified until research candidates are curated against this product's tool type and intended use.",
      sideEffects:
        productKind === "supplement"
          ? "Safety review is pending. Production curation should check contraindications, adverse events, and label warnings."
          : "Safety review is pending. Production curation should check strain risk, fit, resistance progression, and misuse limits.",
      limitations:
        "This is a product-specific research queue item, not a completed clinical appraisal."
    }
  };
}

export function buildLocalEvidenceForProduct(input: LocalEvidenceInput): Pick<
  MarketplaceProduct,
  "productKind" | "score" | "benefits" | "research" | "bestFor"
> {
  const baseQuery = productQuery(input) || input.name;
  const ingredientQuery = ingredientNames(input.ingredients).join(" ") || input.name;
  const asinContext = input.asin ? ` ASIN ${input.asin}` : "";
  const productKind = detectProductKind(input);
  const reviewLabel = productKind === "supplement" ? "Ingredient and dose" : "Setup and protocol";

  const research = [
    makeResearchItem(
      input,
      1,
      `PubMed search queued for ${input.name}`,
      `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeSearch(`${baseQuery} clinical trial safety`)}`,
      `Searches PubMed for clinical trials, safety papers, and ingredient evidence related to ${input.name}${asinContext}.`,
      "clinical relevance"
    ),
    makeResearchItem(
      input,
      2,
      `OpenAlex literature search queued for ${input.name}`,
      `https://openalex.org/works?search=${encodeSearch(`${baseQuery} review`)}`,
      `Searches scholarly metadata for reviews and highly cited papers that may apply to ${input.name}.`,
      "research strength"
    ),
    makeResearchItem(
      input,
      3,
      `Semantic Scholar evidence search queued for ${input.name}`,
      `https://www.semanticscholar.org/search?q=${encodeSearch(`${baseQuery} randomized trial`)}`,
      "Searches for papers with abstracts, citation signals, and study type metadata before claim writing.",
      "study quality"
    ),
    makeResearchItem(
      input,
      4,
      `ClinicalTrials.gov search queued for ${input.name}`,
      `https://clinicaltrials.gov/search?term=${encodeSearch(ingredientQuery)}`,
      `Checks whether the ingredients or product category have registered human trials relevant to ${input.category}.`,
      "human trial availability"
    ),
    makeResearchItem(
      input,
      5,
      `Safety and tolerability search queued for ${input.name}`,
      `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeSearch(`${ingredientQuery} adverse events tolerability`)}`,
      "Focuses on side effects, tolerability, contraindications, and dose-related safety signals.",
      "safety"
    )
  ];

  const benefits: MarketplaceProduct["benefits"] = [
    {
      id: `${input.productId}-benefit-research`,
      claim: `Research is queued for ${input.name}; no health benefit is verified yet.`,
      confidence: 0.42,
      articleId: research[0]?.id,
      articleRank: 1
    },
    {
      id: `${input.productId}-benefit-dose`,
      claim:
        input.ingredients.length > 0
          ? `Ingredient and dose review is pending for ${input.ingredients.length} detected ingredient${
              input.ingredients.length === 1 ? "" : "s"
            }.`
          : `${reviewLabel} review is pending for ${input.name}.`,
      confidence: 0.38,
      articleId: research[3]?.id,
      articleRank: 4
    },
    {
      id: `${input.productId}-benefit-safety`,
      claim: `Safety, tolerability, and contraindication checks are pending for this ${input.category} product.`,
      confidence: 0.36,
      articleId: research[4]?.id,
      articleRank: 5
    },
    {
      id: `${input.productId}-benefit-value`,
      claim:
        productKind === "supplement"
          ? "Value scoring will update after active ingredient amounts and current price are confirmed."
          : "Utility scoring will update after product use case, durability, adjustability, and price are confirmed.",
      confidence: 0.34,
      articleId: research[1]?.id,
      articleRank: 2
    }
  ];

  return {
    productKind,
    score: {
      healthScore: 42,
      valueScore: 40,
      evidenceGrade: "Research queued",
      valueGrade: productKind === "supplement" ? "Pending label review" : "Pending product review",
      explanation: `${input.name} has been added to Verity. The page shows product-specific research discovery links and conservative pending-review signals until article discovery, AI curation, and scoring verify publishable claims.`
    },
    bestFor: buildBestFor(input, benefits.map((benefit) => benefit.claim), false),
    benefits,
    research
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

function buildBestFor(input: LocalEvidenceInput, claims: string[], curated: boolean) {
  const kind = detectProductKind(input);
  const category = input.category.toLowerCase();
  const productText = `${input.name} ${input.category} ${claims.join(" ")}`.toLowerCase();
  const primaryGoal = /sleep|eye mask|blindfold|light|\brest\b/i.test(productText)
    ? "blocking light and creating a calmer sleep environment"
    : /cold plunge|ice bath|cold water immersion|cryotherapy|cold therapy|plunge tub|recovery tub|ice pod/i.test(
          productText
        )
      ? "cold-water recovery, muscle soreness management, and safe plunge setup"
    : /grip|forearm|wrist|hand/i.test(productText)
      ? "hand, wrist, or forearm training"
      : /olive|oil|polyphenol|evoo/i.test(productText)
        ? "choosing a polyphenol-rich cooking oil with wellness context"
      : `comparing ${category} products with research context`;

  if (curated) {
    return [
      `People who want ${primaryGoal}.`,
      "Buyers who want direct user benefits separated from weaker or indirect evidence.",
      kind === "supplement"
        ? "Shoppers comparing likely benefit, ingredient dose, safety, and limitations."
        : "Shoppers comparing likely benefit, comfort, setup, safety, and practical fit."
    ];
  }

  return [
    `People researching ${category} options for ${primaryGoal}.`,
    "Shoppers who want published evidence checked before trusting benefit claims.",
    kind === "supplement"
      ? "Best held for review until ingredient label, dose, safety, and study relevance are confirmed."
      : "Best held for review until setup, use case, ergonomics, safety, and study relevance are confirmed."
  ];
}

function productKindDescription(input: LocalEvidenceInput) {
  if (/cold plunge|ice bath|cold water immersion|cryotherapy|cold therapy|plunge tub|recovery tub|ice pod/i.test(input.name)) {
    return `${input.name} is a cold-water immersion recovery product. Evaluate it against human evidence for muscle soreness, exercise recovery, perceived recovery, sleep or stress recovery when relevant, cardiovascular response, contraindications, safe water temperature, exposure duration, supervision, and practical at-home setup.`;
  }

  if (detectProductKind(input) === "equipment") {
    return `${input.name} is a non-ingestible tool. Evaluate it against biomechanics, training protocol, ergonomics, durability, safety, hand function, mobility, healthy aging, and long-term practical usefulness rather than supplement dosage.`;
  }

  if (input.ingredients.length) {
    const ingredients = input.ingredients.map((ingredient) => ingredient.name).join(", ");
    return `${input.name} contains ${ingredients}. Evaluate human evidence for likely benefits, safety, tolerability, clinically relevant dose, biomarkers, older-adult relevance, and long-term health context.`;
  }

  return `${input.name} is a ${input.category} product. Evaluate published evidence for realistic user benefits, safety, quality of life, function, comfort, healthy-aging relevance, and limitations without assuming disease treatment.`;
}

function articleIdForBenefit(benefit: CuratedResearchResult["benefits"][number], research: MarketplaceProduct["research"]) {
  const doi = benefit.articleDoi?.toLowerCase();
  const title = benefit.articleTitle?.toLowerCase();

  return (
    research.find((paper) => doi && paper.article.doi?.toLowerCase() === doi)?.id ??
    research.find((paper) => title && paper.article.title.toLowerCase() === title)?.id ??
    research[0]?.id ??
    null
  );
}

function curatedToMarketplaceEvidence(
  input: LocalEvidenceInput,
  curated: CuratedResearchResult
): Pick<MarketplaceProduct, "productKind" | "score" | "benefits" | "research" | "bestFor"> | null {
  if (!curated.papers.length || curated.model === "empty-fallback") return null;
  const productKind = detectProductKind(input);

  const research: MarketplaceProduct["research"] = curated.papers.map((paper, index) => {
    const id = `${input.productId}-curated-${index + 1}`;

    return {
      id,
      rank: paper.rank,
      matchConfidence: paper.matchConfidence,
      rationale: paper.rationale,
      article: {
        id,
        doi: paper.doi,
        title: paper.title,
        authors: paper.authors,
        journal: paper.journal,
        publicationYear: paper.publicationYear,
        studyType: String(paper.studyType),
        sampleSize: paper.sampleSize,
        citationCount: paper.citationCount ?? 0,
        url: paper.url
      },
      summary: {
        summary: paper.summary,
        efficacy: paper.efficacy,
        sideEffects: paper.sideEffects,
        dosage: paper.dosage,
        limitations: paper.limitations
      }
    };
  });

  const benefits: MarketplaceProduct["benefits"] = curated.benefits.slice(0, 4).map((benefit, index) => {
    const articleId = articleIdForBenefit(benefit, research);
    const rank = research.find((paper) => paper.id === articleId)?.rank ?? null;

    return {
      id: `${input.productId}-curated-benefit-${index + 1}`,
      claim: benefit.claim,
      confidence: benefit.confidence,
      articleId,
      articleRank: rank
    };
  });

  const evidenceInputs = research.map((paper) => ({
    studyType: paper.article.studyType,
    sampleSize: paper.article.sampleSize,
    citationCount: paper.article.citationCount,
    publicationYear: paper.article.publicationYear,
    matchConfidence: paper.matchConfidence,
    title: paper.article.title,
    summary: `${paper.summary?.summary ?? ""} ${paper.summary?.efficacy ?? ""} ${paper.summary?.limitations ?? ""}`
  }));
  const health = calculateBenefitScore(evidenceInputs, {
    name: input.name,
    category: input.category,
    ingredients: input.ingredients,
    productKind,
    benefitConfidence: benefitConfidenceAverage(benefits)
  });
  const value = calculateValueScore(null, input.ingredients);
  const utility = calculateProductFitScore(
    {
      name: input.name,
      category: input.category,
      ingredients: input.ingredients,
      productKind,
      benefitConfidence: benefitConfidenceAverage(benefits)
    },
    health.score,
    value
  );

  return {
    productKind,
    score: {
      healthScore: health.score,
      valueScore: utility.score,
      evidenceGrade: health.grade,
      valueGrade: utility.grade,
      explanation: `${health.explanation} ${utility.explanation} Curated with ${curated.model}.`
    },
    bestFor: buildBestFor(
      input,
      benefits.map((benefit) => benefit.claim),
      true
    ),
    benefits:
      benefits.length > 0
        ? benefits
        : [
            {
              id: `${input.productId}-curated-benefit-review`,
              claim: `Relevant research was found for ${input.name}, but benefits still need manual review before publishing consumer claims.`,
              confidence: research[0]?.matchConfidence ?? 0.5,
              articleId: research[0]?.id,
              articleRank: research[0]?.rank
            }
          ],
    research
  };
}

export async function buildBestAvailableLocalEvidenceForProduct(input: LocalEvidenceInput): Promise<Pick<
  MarketplaceProduct,
  "productKind" | "score" | "benefits" | "research" | "bestFor"
>> {
  if (process.env.LOCAL_RESEARCH_ENABLED === "false") return buildLocalEvidenceForProduct(input);

  const timeoutMs = Number(process.env.LOCAL_RESEARCH_TIMEOUT_MS ?? 90000);

  try {
    const candidates = await withTimeout(
      discoverCandidateArticles({
        id: input.productId,
        name: input.name,
        brand: input.brand,
        category: input.category,
        description: productKindDescription(input),
        ingredients: input.ingredients,
        price: null
      }),
      timeoutMs,
      "Research discovery"
    );

    if (!candidates.length) {
      return buildLocalEvidenceForProduct(input);
    }

    const curated = await withTimeout(
      curateTopEvidence(
        {
          id: input.productId,
          name: input.name,
          brand: input.brand,
          category: input.category,
          description: productKindDescription(input),
          ingredients: input.ingredients,
          price: null
        },
        candidates
      ),
      timeoutMs,
      "Local AI curation"
    );
    return curatedToMarketplaceEvidence(input, curated) ?? buildLocalEvidenceForProduct(input);
  } catch (error) {
    console.error(error);
    return buildLocalEvidenceForProduct(input);
  }
}
