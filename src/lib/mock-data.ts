import type { MarketplaceProduct } from "@/lib/products";

export const mockProduct: MarketplaceProduct = {
  id: "mock-nutracalm",
  name: "NutraCalm Magnesium Glycinate",
  brand: "NutraCalm Labs",
  category: "Sleep & Stress",
  price: 28,
  currency: "USD",
  description:
    "A gentle magnesium glycinate supplement positioned for sleep quality, evening recovery, and daily nervous-system support.",
  imageUrls: [
    "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=1100&q=80",
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1100&q=80"
  ],
  asin: "B0SCIENCE01",
  amazonAffiliateLink: "https://www.amazon.com/dp/B0SCIENCE01?tag=researchmarket-20",
  ingredients: [
    {
      name: "Magnesium glycinate",
      amount: 200,
      unit: "mg",
      clinicallyEffectiveDose: 200,
      costShare: 1
    }
  ],
  score: {
    healthScore: 86,
    valueScore: 78,
    evidenceGrade: "Strong",
    valueGrade: "Good",
    explanation:
      "Weighted toward simulated meta-analysis and randomized-trial data, with value normalized against clinically relevant magnesium dosage."
  },
  benefits: [
    {
      id: "benefit-1",
      claim: "May support subjective sleep quality when nightly magnesium intake is inadequate.",
      confidence: 0.9,
      articleId: "paper-1",
      articleRank: 1
    },
    {
      id: "benefit-2",
      claim: "May help shorten self-reported sleep latency over several weeks.",
      confidence: 0.84,
      articleId: "paper-2",
      articleRank: 2
    },
    {
      id: "benefit-3",
      claim: "Provides a clinically relevant 200 mg elemental magnesium serving.",
      confidence: 0.88,
      articleId: "paper-5",
      articleRank: 5
    },
    {
      id: "benefit-4",
      claim: "Uses a magnesium form associated with gentle digestive tolerability in small trials.",
      confidence: 0.78,
      articleId: "paper-5",
      articleRank: 5
    }
  ],
  research: [
    {
      id: "paper-1",
      rank: 1,
      matchConfidence: 0.94,
      rationale: "Highest-level simulated evidence connected to magnesium and sleep outcomes.",
      article: {
        id: "paper-1",
        doi: null,
        title: "Simulated Meta-analysis of Magnesium Supplementation and Sleep Quality",
        authors: ["A. Evidence", "M. Review"],
        journal: "Journal of Simulated Nutrition Evidence",
        publicationYear: 2024,
        studyType: "META_ANALYSIS",
        sampleSize: 1820,
        citationCount: 96,
        url: "https://pubmed.ncbi.nlm.nih.gov/?term=magnesium+supplementation+insomnia+older+adults+systematic+review+meta-analysis"
      },
      summary: {
        summary:
          "Across controlled sleep studies, magnesium supplementation was associated with modest improvements in subjective sleep quality.",
        efficacy:
          "Most useful for sleep quality and evening relaxation when the product delivers 200 mg or more elemental magnesium daily.",
        sideEffects: "GI upset can occur, particularly at higher doses or with sensitive digestion.",
        dosage: "Trials commonly used 200-400 mg elemental magnesium per day.",
        limitations:
          "Study duration, magnesium form, and baseline deficiency status varied across included trials."
      }
    },
    {
      id: "paper-2",
      rank: 2,
      matchConfidence: 0.89,
      rationale: "Direct simulated RCT evidence for the core sleep-latency claim.",
      article: {
        id: "paper-2",
        doi: null,
        title: "Simulated Randomized Trial of Magnesium Glycinate for Sleep Latency",
        authors: ["L. Trial", "S. Clinician"],
        journal: "Clinical Sleep Nutrition",
        publicationYear: 2023,
        studyType: "RANDOMIZED_CONTROLLED_TRIAL",
        sampleSize: 214,
        citationCount: 34,
        url: "https://pubmed.ncbi.nlm.nih.gov/23853635/"
      },
      summary: {
        summary:
          "The trial found a small reduction in self-reported time to fall asleep versus placebo after eight weeks.",
        efficacy:
          "Evidence points to a gentle effect, not a sedative-like effect, with stronger response in participants reporting poor baseline sleep.",
        sideEffects: "Reported side effects were mild and most often digestive.",
        dosage: "Participants received 240 mg elemental magnesium nightly.",
        limitations:
          "The study relied partly on self-reported sleep diaries and had limited long-term follow-up."
      }
    },
    {
      id: "paper-3",
      rank: 3,
      matchConfidence: 0.82,
      rationale: "Relevant to the product's stress-support framing and ingredient dosage.",
      article: {
        id: "paper-3",
        doi: null,
        title: "Simulated Systematic Review of Magnesium Intake and Stress Biomarkers",
        authors: ["N. Calm", "R. Biomarker"],
        journal: "Nutrients and Stress Research",
        publicationYear: 2022,
        studyType: "SYSTEMATIC_REVIEW",
        sampleSize: 970,
        citationCount: 57,
        url: "https://pubmed.ncbi.nlm.nih.gov/?term=magnesium+supplementation+stress+systematic+review"
      },
      summary: {
        summary:
          "The review found mixed but promising evidence for magnesium status and stress-related outcomes.",
        efficacy:
          "Supports positioning around daily stress resilience while avoiding disease-treatment claims.",
        sideEffects: "No serious supplement-related events were highlighted in the included trials.",
        dosage: "Common supplemental ranges were 150-300 mg elemental magnesium per day.",
        limitations: "Heterogeneous outcome measures make the size of the effect uncertain."
      }
    },
    {
      id: "paper-4",
      rank: 4,
      matchConfidence: 0.74,
      rationale: "Adds population-level context but is weighted below interventional evidence.",
      article: {
        id: "paper-4",
        doi: null,
        title: "Simulated Prospective Cohort on Dietary Magnesium Intake and Sleep Duration",
        authors: ["P. Cohort", "I. Intake"],
        journal: "Population Nutrition Reports",
        publicationYear: 2021,
        studyType: "COHORT",
        sampleSize: 4420,
        citationCount: 41,
        url: "https://pubmed.ncbi.nlm.nih.gov/?term=dietary+magnesium+intake+sleep+duration+cohort"
      },
      summary: {
        summary:
          "Higher dietary magnesium intake tracked with more favorable sleep duration patterns.",
        efficacy:
          "Useful as supportive context for adequate magnesium intake rather than proof of product-specific efficacy.",
        sideEffects: "Observational dietary intake data did not assess supplement side effects.",
        dosage: "Not a supplementation trial; dietary intake estimates were modeled.",
        limitations: "Observational design leaves room for lifestyle and diet confounding."
      }
    },
    {
      id: "paper-5",
      rank: 5,
      matchConfidence: 0.78,
      rationale: "Ingredient-form evidence that helps explain the product's tolerability profile.",
      article: {
        id: "paper-5",
        doi: null,
        title: "Simulated Crossover Trial Comparing Magnesium Glycinate Tolerability",
        authors: ["G. Tolerance", "B. Mineral"],
        journal: "Mineral Supplementation Science",
        publicationYear: 2020,
        studyType: "RANDOMIZED_CONTROLLED_TRIAL",
        sampleSize: 88,
        citationCount: 22,
        url: "https://pubmed.ncbi.nlm.nih.gov/?term=magnesium+glycinate+bioavailability+tolerability+trial"
      },
      summary: {
        summary:
          "Magnesium glycinate was well tolerated in a short crossover comparison.",
        efficacy:
          "Supports the formulation choice and tolerability positioning more than a specific sleep claim.",
        sideEffects: "Loose stools and abdominal discomfort were uncommon at moderate dosages.",
        dosage: "Participants used 200 mg elemental magnesium per day.",
        limitations: "Small sample size and short duration limit broad generalization."
      }
    }
  ]
};
