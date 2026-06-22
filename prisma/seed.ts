import { Prisma, PrismaClient, ResearchSource, StudyType } from "@prisma/client";

const prisma = new PrismaClient();

const productSeed = {
  asin: "B0SCIENCE01",
  name: "NutraCalm Magnesium Glycinate",
  brand: "NutraCalm Labs",
  category: "Sleep & Stress",
  price: new Prisma.Decimal("28.00"),
  currency: "USD",
  amazonAffiliateLink: "https://www.amazon.com/dp/B0SCIENCE01?tag=researchmarket-20",
  description:
    "A gentle magnesium glycinate supplement positioned for sleep quality, evening recovery, and daily nervous-system support.",
  imageUrls: [
    "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=1100&q=80",
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1100&q=80"
  ],
  ingredients: [
    {
      name: "Magnesium glycinate",
      amount: 200,
      unit: "mg",
      clinicallyEffectiveDose: 200,
      costShare: 1
    }
  ]
};

const articleSeeds = [
  {
    doi: "seed-nutracalm-meta-sleep",
    title: "Simulated Meta-analysis of Magnesium Supplementation and Sleep Quality",
    authors: ["A. Evidence", "M. Review"],
    journal: "Journal of Simulated Nutrition Evidence",
    publicationYear: 2024,
    studyType: StudyType.META_ANALYSIS,
    sampleSize: 1820,
    citationCount: 96,
    url: "https://pubmed.ncbi.nlm.nih.gov/?term=magnesium+supplementation+insomnia+older+adults+systematic+review+meta-analysis",
    source: ResearchSource.MANUAL,
    matchConfidence: 0.94,
    rank: 1,
    summary:
      "Across controlled sleep studies, magnesium supplementation was associated with modest improvements in subjective sleep quality, especially among adults with low baseline magnesium intake.",
    efficacy:
      "Most useful for sleep quality and evening relaxation when the product delivers 200 mg or more elemental magnesium daily.",
    sideEffects:
      "GI upset can occur, particularly at higher doses or with sensitive digestion.",
    dosage: "Trials commonly used 200-400 mg elemental magnesium per day.",
    limitations:
      "Study duration, magnesium form, and baseline deficiency status varied across included trials.",
    rationale: "Highest-level evidence directly connected to magnesium and sleep outcomes."
  },
  {
    doi: "seed-nutracalm-rct-sleep-latency",
    title: "Simulated Randomized Trial of Magnesium Glycinate for Sleep Latency",
    authors: ["L. Trial", "S. Clinician"],
    journal: "Clinical Sleep Nutrition",
    publicationYear: 2023,
    studyType: StudyType.RANDOMIZED_CONTROLLED_TRIAL,
    sampleSize: 214,
    citationCount: 34,
    url: "https://pubmed.ncbi.nlm.nih.gov/23853635/",
    source: ResearchSource.MANUAL,
    matchConfidence: 0.89,
    rank: 2,
    summary:
      "The trial found a small reduction in self-reported time to fall asleep versus placebo after eight weeks of nightly supplementation.",
    efficacy:
      "Evidence points to a gentle effect, not a sedative-like effect, with stronger response in participants reporting poor baseline sleep.",
    sideEffects:
      "Reported side effects were mild and most often digestive.",
    dosage: "Participants received 240 mg elemental magnesium nightly.",
    limitations:
      "The study relied partly on self-reported sleep diaries and had limited long-term follow-up.",
    rationale: "Direct RCT evidence for a core claim made by the product."
  },
  {
    doi: "seed-nutracalm-review-stress",
    title: "Simulated Systematic Review of Magnesium Intake and Stress Biomarkers",
    authors: ["N. Calm", "R. Biomarker"],
    journal: "Nutrients and Stress Research",
    publicationYear: 2022,
    studyType: StudyType.SYSTEMATIC_REVIEW,
    sampleSize: 970,
    citationCount: 57,
    url: "https://pubmed.ncbi.nlm.nih.gov/?term=magnesium+supplementation+stress+systematic+review",
    source: ResearchSource.MANUAL,
    matchConfidence: 0.82,
    rank: 3,
    summary:
      "The review found mixed but promising evidence for magnesium status and stress-related outcomes, with the clearest signal in populations with inadequate intake.",
    efficacy:
      "Supports positioning around daily stress resilience, while avoiding claims that it treats anxiety disorders.",
    sideEffects: "No serious supplement-related events were highlighted in the included trials.",
    dosage: "Common supplemental ranges were 150-300 mg elemental magnesium per day.",
    limitations:
      "Heterogeneous outcome measures make the size of the effect uncertain.",
    rationale: "Relevant to the product's stress-support framing and ingredient dosage."
  },
  {
    doi: "seed-nutracalm-cohort-intake",
    title: "Simulated Prospective Cohort on Dietary Magnesium Intake and Sleep Duration",
    authors: ["P. Cohort", "I. Intake"],
    journal: "Population Nutrition Reports",
    publicationYear: 2021,
    studyType: StudyType.COHORT,
    sampleSize: 4420,
    citationCount: 41,
    url: "https://pubmed.ncbi.nlm.nih.gov/?term=dietary+magnesium+intake+sleep+duration+cohort",
    source: ResearchSource.MANUAL,
    matchConfidence: 0.74,
    rank: 4,
    summary:
      "Higher dietary magnesium intake tracked with more favorable sleep duration patterns, but the study cannot prove supplementation caused the effect.",
    efficacy:
      "Useful as supportive context for adequate magnesium intake rather than proof of product-specific efficacy.",
    sideEffects: "Observational dietary intake data did not assess supplement side effects.",
    dosage: "Not a supplementation trial; dietary intake estimates were modeled.",
    limitations:
      "Observational design leaves room for lifestyle and diet confounding.",
    rationale: "Adds population-level context but is weighted below interventional evidence."
  },
  {
    doi: "seed-nutracalm-rct-absorption",
    title: "Simulated Crossover Trial Comparing Magnesium Glycinate Tolerability",
    authors: ["G. Tolerance", "B. Mineral"],
    journal: "Mineral Supplementation Science",
    publicationYear: 2020,
    studyType: StudyType.RANDOMIZED_CONTROLLED_TRIAL,
    sampleSize: 88,
    citationCount: 22,
    url: "https://pubmed.ncbi.nlm.nih.gov/?term=magnesium+glycinate+bioavailability+tolerability+trial",
    source: ResearchSource.MANUAL,
    matchConfidence: 0.78,
    rank: 5,
    summary:
      "Magnesium glycinate was well tolerated in a short crossover comparison, with fewer digestive complaints than some alternative forms.",
    efficacy:
      "Supports the formulation choice and tolerability positioning more than a specific sleep claim.",
    sideEffects:
      "Loose stools and abdominal discomfort were uncommon at moderate dosages.",
    dosage: "Participants used 200 mg elemental magnesium per day.",
    limitations: "Small sample size and short duration limit broad generalization.",
    rationale: "Ingredient-form evidence that helps explain the product's user experience."
  }
];

const benefitSeeds = [
  {
    claim: "May support subjective sleep quality when nightly magnesium intake is inadequate.",
    confidence: 0.9,
    articleRank: 1
  },
  {
    claim: "May help shorten self-reported sleep latency over several weeks.",
    confidence: 0.84,
    articleRank: 2
  },
  {
    claim: "Provides a clinically relevant 200 mg elemental magnesium serving.",
    confidence: 0.88,
    articleRank: 5
  },
  {
    claim: "Uses a magnesium form associated with gentle digestive tolerability in small trials.",
    confidence: 0.78,
    articleRank: 5
  }
];

async function main() {
  const product = await prisma.product.upsert({
    where: { asin: productSeed.asin },
    update: {
      name: productSeed.name,
      brand: productSeed.brand,
      category: productSeed.category,
      price: productSeed.price,
      currency: productSeed.currency,
      amazonAffiliateLink: productSeed.amazonAffiliateLink,
      description: productSeed.description,
      imageUrls: productSeed.imageUrls,
      ingredients: productSeed.ingredients,
      status: "PUBLISHED"
    },
    create: {
      ...productSeed,
      status: "PUBLISHED"
    }
  });

  await prisma.$transaction([
    prisma.productResearch.deleteMany({ where: { productId: product.id } }),
    prisma.productBenefit.deleteMany({ where: { productId: product.id } }),
    prisma.aiSummary.deleteMany({ where: { productId: product.id } }),
    prisma.productScore.deleteMany({ where: { productId: product.id } })
  ]);

  const articleByRank = new Map<number, string>();

  for (const articleSeed of articleSeeds) {
    const article = await prisma.researchArticle.upsert({
      where: { doi: articleSeed.doi },
      update: {
        title: articleSeed.title,
        authors: articleSeed.authors,
        journal: articleSeed.journal,
        publicationYear: articleSeed.publicationYear,
        studyType: articleSeed.studyType,
        sampleSize: articleSeed.sampleSize,
        citationCount: articleSeed.citationCount,
        url: articleSeed.url,
        source: articleSeed.source
      },
      create: {
        doi: articleSeed.doi,
        title: articleSeed.title,
        authors: articleSeed.authors,
        journal: articleSeed.journal,
        publicationYear: articleSeed.publicationYear,
        studyType: articleSeed.studyType,
        sampleSize: articleSeed.sampleSize,
        citationCount: articleSeed.citationCount,
        url: articleSeed.url,
        source: articleSeed.source
      }
    });

    articleByRank.set(articleSeed.rank, article.id);

    await prisma.productResearch.create({
      data: {
        productId: product.id,
        articleId: article.id,
        matchConfidence: articleSeed.matchConfidence,
        rank: articleSeed.rank,
        rationale: articleSeed.rationale
      }
    });

    await prisma.aiSummary.create({
      data: {
        productId: product.id,
        articleId: article.id,
        summary: articleSeed.summary,
        efficacy: articleSeed.efficacy,
        sideEffects: articleSeed.sideEffects,
        dosage: articleSeed.dosage,
        limitations: articleSeed.limitations,
        model: "seeded-mock-v1"
      }
    });
  }

  await prisma.productBenefit.createMany({
    data: benefitSeeds.map((benefit, index) => ({
      productId: product.id,
      verifiedByArticleId: articleByRank.get(benefit.articleRank),
      claim: benefit.claim,
      confidence: benefit.confidence,
      displayOrder: index + 1
    }))
  });

  await prisma.productScore.create({
    data: {
      productId: product.id,
      healthScore: 86,
      valueScore: 78,
      evidenceGrade: "Strong",
      valueGrade: "Good",
      explanation:
        "Seeded score based on a simulated top-five evidence set weighted toward meta-analysis and randomized controlled trial data."
    }
  });

  console.log(`Seeded product: ${product.name} (${product.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
