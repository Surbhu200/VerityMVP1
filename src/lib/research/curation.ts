import { ResearchSource, StudyType } from "@prisma/client";
import { fetchJsonWithRetry } from "@/lib/retry";
import type {
  CuratedBenefit,
  CuratedPaper,
  CuratedResearchResult,
  ProductForResearch,
  ResearchCandidate
} from "@/lib/research/types";

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type OllamaChatResponse = {
  message?: {
    content?: string;
  };
};

type AiCurationPayload = {
  topPapers?: Array<Record<string, unknown>>;
  benefits?: unknown[];
};

type PaperSummaryPayload = {
  summary?: string;
  efficacy?: string;
  sideEffects?: string;
  dosage?: string;
  limitations?: string;
  claim?: string;
  confidence?: number;
};

const studyPriority: Record<string, number> = {
  META_ANALYSIS: 100,
  SYSTEMATIC_REVIEW: 92,
  RANDOMIZED_CONTROLLED_TRIAL: 88,
  COHORT: 62,
  OBSERVATIONAL: 50,
  CASE_STUDY: 28,
  IN_VITRO: 18,
  OTHER: 20
};

function normalizeDoi(doi?: string | null) {
  return doi?.replace(/^https?:\/\/doi\.org\//i, "").trim().toLowerCase() ?? null;
}

function normalizeTitle(title?: string | null) {
  return title?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}

function truncateAtWord(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  const slice = value.slice(0, maxLength).replace(/\s+\S*$/, "").trim();
  return `${slice || value.slice(0, maxLength).trim()}...`;
}

function envNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function scoreCandidate(candidate: ResearchCandidate) {
  return (
    (studyPriority[String(candidate.studyType)] ?? studyPriority.OTHER) +
    Math.min(20, Math.log10((candidate.citationCount ?? 0) + 1) * 8) +
    Math.min(10, Math.log10((candidate.sampleSize ?? 0) + 1) * 4) +
    (candidate.publicationYear ? Math.max(0, 2028 - candidate.publicationYear) * -0.2 : 0)
  );
}

function hasIngredients(product: ProductForResearch) {
  return Array.isArray(product.ingredients) && product.ingredients.length > 0;
}

function isSleepMaskProduct(product: ProductForResearch) {
  const text = `${product.name} ${product.category} ${product.description ?? ""}`.toLowerCase();
  return /eye mask|sleep mask|blindfold|\bmask\b|light blocking/.test(text);
}

function isColdPlungeProduct(product: ProductForResearch) {
  return /cold plunge|ice bath|cold water immersion|cryotherapy|cold therapy|plunge tub|recovery tub|ice pod/.test(
    productText(product)
  );
}

function productText(product: ProductForResearch) {
  return `${product.name} ${product.category} ${product.description ?? ""}`.toLowerCase();
}

function productCoreTerms(product: ProductForResearch) {
  const ingredientTerms = Array.isArray(product.ingredients)
    ? product.ingredients
        .map((ingredient) =>
          typeof ingredient === "object" && ingredient && "name" in ingredient
            ? String((ingredient as { name?: unknown }).name)
            : ""
        )
        .filter(Boolean)
    : [];
  const text = `${product.name} ${product.category}`
    .replace(/\b[A-Z0-9]{10}\b/g, "")
    .replace(/[^\w\s-]/g, " ")
    .toLowerCase();
  const titleTerms = text
    .split(/\s+/)
    .filter(
      (term) =>
        term.length > 3 &&
        !/^(amazon|product|with|from|this|that|details|pack|count|black|white|large|small|adjustable|premium|professional|original|bundle|sleep|health|wellness|support|daily|supplement)$/.test(
          term
        )
    )
    .slice(0, 7);

  return Array.from(new Set([...ingredientTerms, ...titleTerms].map((term) => term.toLowerCase()))).slice(0, 10);
}

function productCategoryMatch(product: ProductForResearch, haystack: string) {
  const text = productText(product);

  if (/grip|forearm|wrist|hand/.test(text)) {
    return /grip strength|handgrip|forearm|wrist|hand function|dynamometer|rehabilitation/.test(haystack);
  }

  if (isColdPlungeProduct(product)) {
    return (
      /cold water immersion|cold-water immersion|ice bath|cold plunge|cryotherapy|hydrotherapy|cold therapy/.test(
        haystack
      ) &&
      /recovery|muscle soreness|exercise|athlete|cardiovascular|safety|sleep|inflammation|performance/.test(haystack)
    );
  }

  if (isSleepMaskProduct(product)) {
    return (
      /sleep quality|circadian|insomnia|sleep/.test(haystack) &&
      /eye mask|sleep mask|\bmask\b|light blocking|light exposure|darkness|earplug/.test(haystack)
    );
  }

  if (/sleep|insomnia|relaxation/.test(text) && hasIngredients(product)) {
    const ingredientHit = productCoreTerms(product).some((term) => term.length > 3 && haystack.includes(term));

    return (
      ingredientHit &&
      /sleep quality|sleep latency|insomnia|circadian|melatonin|magnesium|glycinate|theanine|gaba/.test(haystack)
    );
  }

  if (/olive|oil|polyphenol|evoo/.test(text)) {
    return /extra virgin olive oil|olive oil|polyphenol|phenolic compounds|mediterranean diet|oleuropein|hydroxytyrosol/.test(
      haystack
    );
  }

  if (/skin|hair|beauty|satin|silk|cream|serum|lotion|sunscreen|spf/.test(text)) {
    return /dermatology|skin barrier|sunscreen|photoprotection|photoaging|skin cancer|quality of life|tolerability/.test(
      haystack
    );
  }

  if (/massager|brace|splint|wrap|posture|support|orthopedic|orthotic|compression|trainer|resistance/.test(text)) {
    return /pain|function|mobility|rehabilitation|biomechanics|range of motion|quality of life|exercise|training|strength/.test(
      haystack
    );
  }

  return false;
}

function curationRelevanceScore(product: ProductForResearch, candidate: ResearchCandidate) {
  const haystack = `${candidate.title} ${candidate.abstract ?? ""} ${candidate.journal ?? ""}`.toLowerCase();
  const coreTerms = productCoreTerms(product);
  const coreHits = coreTerms.reduce((score, term) => score + (term.length > 3 && haystack.includes(term) ? 12 : 0), 0);
  const categoryHit = productCategoryMatch(product, haystack) ? 40 : 0;
  const foundationHit = foundationalScore(product, candidate) > 0 ? 32 : 0;

  return coreHits + categoryHit + foundationHit;
}

function longevityScore(product: ProductForResearch, candidate: ResearchCandidate) {
  const productTextValue = productText(product);
  const haystack = `${candidate.title} ${candidate.abstract ?? ""} ${candidate.journal ?? ""}`.toLowerCase();
  const currentYear = new Date().getFullYear();
  const age = candidate.publicationYear ? currentYear - candidate.publicationYear : 99;
  const recentScore = age <= 5 ? 34 : age <= 10 ? 28 : age <= 14 ? 20 : age <= 18 ? 10 : -18;
  const broadLongevity =
    /longevity|healthy aging|aging|older adult|older adults|cardiovascular|metabolic|inflammation|recovery|sleep quality|quality of life|mobility|function|frailty|independence/.test(
      haystack
    )
      ? 38
      : 0;
  const sleepFit =
    (/sleep|eye mask|blindfold|light|\brest\b|insomnia|relaxation/.test(productTextValue)) &&
    /sleep quality|circadian|recovery|insomnia|quality of life|aging/.test(haystack)
      ? 28
      : 0;
  const gripFit =
    /grip|forearm|wrist|hand/.test(productTextValue) &&
    /grip strength|handgrip|hand function|mobility|frailty|aging|older adult|older adults|biomarker|successful aging|cognitive function|longitudinal|mortality|disability|independence|rehabilitation/.test(haystack)
      ? 28
      : 0;
  const gripBiomarkerFit =
    /grip|forearm|wrist|hand/.test(productTextValue) &&
    /grip strength.*biomarker|biomarker.*grip strength|older adult|older adults|successful aging/.test(haystack)
      ? 46
      : 0;
  const nutritionFit =
    /olive|oil|polyphenol|evoo/.test(productTextValue) &&
    /cardiovascular|inflammation|polyphenol|mediterranean|aging|longevity|metabolic/.test(haystack)
      ? 28
      : 0;
  const coldFit =
    isColdPlungeProduct(product) &&
    /cold water immersion|cold-water immersion|ice bath|cold plunge|cryotherapy|hydrotherapy|cold therapy/.test(
      haystack
    ) &&
    /recovery|muscle soreness|exercise|athlete|cardiovascular|safety|sleep|inflammation|performance/.test(haystack)
      ? 34
      : 0;

  return broadLongevity + sleepFit + gripFit + gripBiomarkerFit + nutritionFit + coldFit + recentScore + scoreCandidate(candidate) * 0.35;
}

function foundationalScore(product: ProductForResearch, candidate: ResearchCandidate) {
  const productTextValue = productText(product);
  const haystack = `${candidate.title} ${candidate.abstract ?? ""} ${candidate.journal ?? ""}`.toLowerCase();
  const title = candidate.title.toLowerCase();
  const coreTerms = productCoreTerms(product);
  const coreHit = coreTerms.some((term) => term.length > 3 && haystack.includes(term));
  const categoryHit = productCategoryMatch(product, haystack);

  if (!coreHit && !categoryHit) return 0;

  const currentYear = new Date().getFullYear();
  const age = candidate.publicationYear ? currentYear - candidate.publicationYear : 99;
  let score = 0;

  if (/systematic review|meta-analysis|meta analysis|umbrella review/.test(haystack)) score += 74;
  if (/\breview\b|consensus|guideline|position statement|clinical practice|standards/.test(haystack)) score += 42;
  if (/randomized|randomised|placebo|clinical trial|crossover trial/.test(haystack)) score += 32;
  if (/biomarker|validation|reference value|normative|dose-response|mechanism|mechanistic|safety|adverse events|tolerability/.test(haystack)) {
    score += 34;
  }
  if (/longevity|healthy aging|aging|older adult|older adults|cardiovascular|metabolic|inflammation|recovery|sleep quality|quality of life|mobility|function|frailty|independence|photoaging|skin barrier/.test(haystack)) {
    score += 36;
  }
  if (title.includes(coreTerms[0] ?? "__missing__")) score += 12;
  if (categoryHit) score += 26;
  if (coreHit) score += 18;
  if (age <= 5) score += 16;
  else if (age <= 10) score += 12;
  else if (age <= 15) score += 6;
  else if (age > 22) score -= 10;

  if (
    /grip|forearm|wrist|hand/.test(productTextValue) &&
    /grip strength:\s*an indispensable biomarker|indispensable biomarker|grip strength.*biomarker|biomarker.*grip strength/.test(
      haystack
    )
  ) {
    score += 110;
  }

  if (
    /olive|oil|polyphenol|evoo/.test(productTextValue) &&
    /extra virgin olive oil|olive oil.*polyphenol|phenolic compounds|mediterranean diet/.test(haystack)
  ) {
    score += 58;
  }

  if (
    isSleepMaskProduct(product) &&
    /eye mask|sleep mask|light exposure|darkness|sleep quality|circadian/.test(haystack)
  ) {
    score += 46;
  }

  if (
    isColdPlungeProduct(product) &&
    /cold water immersion|cold-water immersion|ice bath|cold plunge|cryotherapy|hydrotherapy|cold therapy/.test(
      haystack
    ) &&
    /recovery|muscle soreness|exercise|athlete|cardiovascular|safety|sleep|inflammation|performance/.test(haystack)
  ) {
    score += 58;
  }

  if (/sleep|insomnia|relaxation/.test(productTextValue) && hasIngredients(product) && /sleep quality|sleep latency|insomnia|adverse events|safety/.test(haystack)) {
    score += 42;
  }

  if (/skin|sunscreen|spf|serum|cream|lotion/.test(productTextValue) && /photoprotection|photoaging|skin barrier|dermatology|tolerability|quality of life/.test(haystack)) {
    score += 42;
  }

  return score >= 68 ? score : 0;
}

function selectTopFive(product: ProductForResearch, candidates: ResearchCandidate[]) {
  const relevantCandidates = candidates.filter((candidate) => curationRelevanceScore(product, candidate) > 0);
  if (!relevantCandidates.length) return [];

  const candidatePool = relevantCandidates;
  const byEvidence = [...candidatePool].sort(
    (a, b) =>
      scoreCandidate(b) +
      curationRelevanceScore(product, b) -
      (scoreCandidate(a) + curationRelevanceScore(product, a))
  );
  const foundational = [...candidatePool]
    .filter((candidate) => foundationalScore(product, candidate) > 0)
    .sort((a, b) => foundationalScore(product, b) - foundationalScore(product, a))
    .slice(0, 2);
  const longevityLeaders = [...candidatePool]
    .filter((candidate) => longevityScore(product, candidate) >= 34)
    .sort((a, b) => longevityScore(product, b) - longevityScore(product, a))
    .slice(0, 2);
  const selected: ResearchCandidate[] = [];

  for (const candidate of [...foundational, ...longevityLeaders]) {
    if (!selected.some((item) => normalizeTitle(item.title) === normalizeTitle(candidate.title))) {
      selected.push(candidate);
    }
  }

  for (const candidate of byEvidence) {
    if (selected.length >= 5) break;
    if (!selected.some((item) => normalizeTitle(item.title) === normalizeTitle(candidate.title))) {
      selected.push(candidate);
    }
  }

  return selected.slice(0, 5);
}

function userBenefitTarget(product: ProductForResearch) {
  const text = `${product.name} ${product.category} ${product.description ?? ""}`.toLowerCase();

  if (isColdPlungeProduct(product)) {
    return "cold-water recovery, muscle soreness, safe plunge setup, and practical post-exercise use";
  }

  if (isSleepMaskProduct(product)) {
    return "darker sleep conditions, comfort, and better subjective sleep quality";
  }

  if (/sleep|insomnia|relaxation/.test(text) && hasIngredients(product)) {
    return "sleep quality, relaxation, safety, and evidence-based dose context";
  }

  if (/grip|forearm|wrist|hand/.test(text)) {
    return "grip strength, hand function, forearm training, or rehabilitation support";
  }

  if (/olive|oil|polyphenol|evoo/.test(text)) {
    return "polyphenol-rich food choices, cardiovascular wellness markers, and everyday dietary quality";
  }

  if (/massager|brace|splint|wrap|device|tool|trainer|resistance/.test(text)) {
    return "comfort, practical function, safe setup, and real-world usefulness";
  }

  return "the product's most realistic positive benefit for the shopper";
}

function fallbackTopFive(product: ProductForResearch, candidates: ResearchCandidate[]): CuratedResearchResult {
  const chosen = selectTopFive(product, candidates);
  const target = userBenefitTarget(product);

  const papers: CuratedPaper[] = chosen.map((candidate, index) => ({
    ...candidate,
    rank: index + 1,
    matchConfidence: Math.max(0.56, Math.min(0.95, 0.9 - index * 0.06)),
    rationale: `Selected by deterministic evidence hierarchy because it is relevant to ${product.name}.`,
    summary:
      candidate.abstract?.slice(0, 360) ||
      `This paper appears relevant to ${target} based on its title, source, and study type.`,
    efficacy:
      `The likely user benefit should be interpreted cautiously until the full paper is reviewed for ${target}.`,
    sideEffects:
      "Safety details should be checked against the full paper and the product's actual use instructions.",
    dosage:
      "Use context could not be reliably extracted from metadata alone and should be verified during curation.",
    limitations:
      "This fallback uses metadata ranking and should be upgraded with full AI or manual review before stronger claims."
  }));

  return {
    papers,
    benefits: papers.slice(0, 3).map((paper) => ({
      claim: `${product.name} may be relevant for shoppers focused on ${target}; this claim is conservative because it is based on metadata-ranked evidence.`,
      confidence: paper.matchConfidence,
      articleDoi: paper.doi,
      articleTitle: paper.title
    })),
    model: "deterministic-fallback"
  };
}

function paperFromAi(
  item: Record<string, unknown>,
  candidates: ResearchCandidate[],
  rank: number
): CuratedPaper | null {
  const doi = typeof item.doi === "string" ? normalizeDoi(item.doi) : null;
  const title = typeof item.title === "string" ? item.title : "";
  const candidateNumber =
    typeof item.candidateNumber === "number"
      ? item.candidateNumber
      : typeof item.candidateIndex === "number"
        ? item.candidateIndex
        : typeof item.rank === "number"
          ? item.rank
          : null;
  const normalizedTitle = normalizeTitle(title);
  const candidate =
    (candidateNumber ? candidates[candidateNumber - 1] : null) ??
    candidates.find((candidateItem) => normalizeDoi(candidateItem.doi) === doi) ??
    candidates.find((candidateItem) => normalizeTitle(candidateItem.title) === normalizedTitle) ??
    candidates.find((candidateItem) => {
      const candidateTitle = normalizeTitle(candidateItem.title);
      return (
        normalizedTitle.length > 20 &&
        (candidateTitle.includes(normalizedTitle) || normalizedTitle.includes(candidateTitle))
      );
    });

  if (!candidate) return null;

  return {
    ...candidate,
    rank,
    matchConfidence:
      typeof item.matchConfidence === "number"
        ? Math.max(0, Math.min(1, item.matchConfidence))
        : Math.max(0.56, 0.92 - rank * 0.06),
    rationale: typeof item.rationale === "string" ? item.rationale : "AI selected this paper as relevant.",
    summary: typeof item.summary === "string" ? item.summary : "",
    efficacy: typeof item.efficacy === "string" ? item.efficacy : "",
    sideEffects: typeof item.sideEffects === "string" ? item.sideEffects : "",
    dosage: typeof item.dosage === "string" ? item.dosage : "",
    limitations: typeof item.limitations === "string" ? item.limitations : ""
  };
}

function benefitsFromAi(items: unknown[], papers: CuratedPaper[]): CuratedBenefit[] {
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const value = item as Record<string, unknown>;
      const articleDoi = typeof value.articleDoi === "string" ? normalizeDoi(value.articleDoi) : null;
      const articleTitle = typeof value.articleTitle === "string" ? value.articleTitle : undefined;
      const normalizedArticleTitle = normalizeTitle(articleTitle);
      const hasPaper = papers.some(
        (paper) =>
          normalizeDoi(paper.doi) === articleDoi ||
          (articleTitle && normalizeTitle(paper.title) === normalizedArticleTitle) ||
          (normalizedArticleTitle.length > 20 &&
            (normalizeTitle(paper.title).includes(normalizedArticleTitle) ||
              normalizedArticleTitle.includes(normalizeTitle(paper.title))))
      );

      if (!hasPaper || typeof value.claim !== "string") return null;

      return {
        claim: value.claim,
        confidence:
          typeof value.confidence === "number" ? Math.max(0, Math.min(1, value.confidence)) : 0.7,
        articleDoi,
        articleTitle
      } satisfies CuratedBenefit;
    })
    .filter(Boolean) as CuratedBenefit[];
}

function aiCurationMessages(product: ProductForResearch, candidates: ResearchCandidate[], candidateLimit = 30) {
  const numberedCandidates = candidates.slice(0, candidateLimit).map((candidate, index) => ({
    candidateNumber: index + 1,
    doi: candidate.doi,
    title: candidate.title,
    authors: candidate.authors,
    journal: candidate.journal,
    publicationYear: candidate.publicationYear,
    studyType: candidate.studyType,
    sampleSize: candidate.sampleSize,
    citationCount: candidate.citationCount,
    url: candidate.url,
    source: candidate.source,
    abstract: candidate.abstract
  }));

  return [
    {
      role: "system",
      content:
        "You are an evidence curator for a health marketplace. Return strict JSON only. Select exactly five papers when at least five candidates exist. Paper #1 and paper #2 should be recent when possible and tied to longevity, healthy aging, recovery, function, mobility, cardiovascular wellness, metabolic wellness, or another long-term user benefit that genuinely fits the product. For every product category, protect foundational papers when they directly match the product or its ingredient/category: systematic reviews, meta-analyses, clinical guidelines, safety papers, biomarker papers, standards, validation studies, and category-defining reviews. Prioritize randomized trials, biomechanical studies, validation studies, and studies that directly match the shopper's practical benefit. Benefits must be buyer-facing, positive when supported, cautious, traceable to selected papers, and must not diagnose, treat, cure, or prevent disease."
    },
    {
      role: "user",
      content: JSON.stringify({
        instructions: {
          shape:
            "{ topPapers: [{ candidateNumber, doi, title, matchConfidence, rationale, summary, efficacy, sideEffects, dosage, limitations }], benefits: [{ claim, confidence, articleDoi, articleTitle }] }",
          requirements:
            `Use candidateNumber from the provided list for every topPapers item. Rank #1 and #2 for recent, user-relevant longevity or long-term health context when the candidate set contains suitable papers. Focus every summary and benefit on the end user's direct positive outcome: ${userBenefitTarget(product)}. For equipment or hardware products, use the dosage field for protocol/setup details such as position, repetitions, training duration, testing method, or fit; do not invent milligram dosing. For general wellness products, use the dosage field for use context, fit, or buying considerations. Do not write as if answering a prompt. Avoid phrases like "this request", "provided paper", "I cannot", or "not directly testing this brand"; when evidence is indirect, explain what broader product category or user outcome it supports. Every benefit must be traceable to articleDoi or articleTitle. If the evidence is weak, write cautious claims or return fewer benefits.`
        },
        product,
        candidates: numberedCandidates
      })
    }
  ];
}

function parseAiCurationPayload(content?: string | null): AiCurationPayload | null {
  if (!content) return null;
  const cleaned = content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned) as AiCurationPayload;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    try {
      return JSON.parse(jsonMatch[0]) as AiCurationPayload;
    } catch {
      return null;
    }
  }
}

function curatedResultFromPayload(
  payload: AiCurationPayload | null,
  candidates: ResearchCandidate[],
  model: string
) {
  const papers: CuratedPaper[] =
    payload?.topPapers
      ?.map((item, index) => paperFromAi(item, candidates, index + 1))
      .filter((paper): paper is CuratedPaper => Boolean(paper))
      .slice(0, 5) ?? [];

  if (!papers.length) return null;

  return {
    papers,
    benefits: benefitsFromAi(payload?.benefits ?? [], papers),
    model
  } satisfies CuratedResearchResult;
}

async function curateWithOllama(product: ProductForResearch, candidates: ResearchCandidate[]) {
  const baseUrl = process.env.LOCAL_AI_BASE_URL || "http://localhost:11434";
  const model = process.env.LOCAL_AI_MODEL || "deepseek-r1:8b";
  if (model.toLowerCase().includes("deepseek-r1")) {
    return curateWithDeepSeekR1(product, candidates, baseUrl, model);
  }

  const messages = aiCurationMessages(product, candidates, envNumber("LOCAL_AI_CANDIDATE_LIMIT", 8));
  const numCtx = envNumber("LOCAL_AI_NUM_CTX", 4096);
  const numGpu = envNumber("LOCAL_AI_NUM_GPU", 999);
  const numBatch = envNumber("LOCAL_AI_NUM_BATCH", 512);

  const data = await fetchJsonWithRetry<OllamaChatResponse>(
    "Ollama curation",
    `${baseUrl.replace(/\/$/, "")}/api/chat`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        format: "json",
        keep_alive: process.env.LOCAL_AI_KEEP_ALIVE || "30m",
        options: {
          temperature: 0.1,
          num_ctx: numCtx,
          num_predict: envNumber("LOCAL_AI_NUM_PREDICT", 4096),
          num_gpu: numGpu,
          num_batch: numBatch
        }
      })
    },
    { retries: 1, baseDelayMs: 650 }
  );

  return curatedResultFromPayload(parseAiCurationPayload(data.message?.content), candidates, `ollama:${model}`);
}

function linesFromDeepSeekText(content?: string | null) {
  const cleaned = content
    ?.replace(/```[\s\S]*?```/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];

  const labeled = cleaned
    .split(/\r?\n|(?=\b(?:Summary|Efficacy|Protocol|Setup|Safety|Limitations?):)/i)
    .map((line) =>
      line
        .replace(/^[-*\d.)\s]+/, "")
        .replace(/^(summary|efficacy|protocol|setup|safety|limitations?|claim):\s*/i, "")
        .trim()
    )
    .filter(Boolean);

  if (labeled.length >= 3) return labeled;

  const sentences =
    cleaned
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? labeled;

  return sentences
    .map((sentence) =>
      sentence
        .replace(/^[-*•\s]+/, "")
        .replace(/^Here is a (?:five-line|5-line|short) summary[^:]*:\s*/i, "")
        .trim()
    )
    .filter((sentence) => sentence && !/^here is\b/i.test(sentence));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function claimFromSummary(product: ProductForResearch, paper: ResearchCandidate, efficacy: string) {
  const target = product.category.toLowerCase().includes("sports") ? "training and assessment" : "intended use";
  const cleaned = efficacy.replace(/^[-*•\s]+/, "").trim();
  const base = cleaned.length > 96 ? `${cleaned.slice(0, 93).trim()}...` : cleaned || paper.title;
  const productName = product.name.split(",")[0]?.replace(/\s+with\s+.*$/i, "").trim() || product.name;

  return `${paper.title} supports cautious review of ${productName} for ${target}: ${base}`;
}

function sanitizeBuyerText(value: string | undefined, paper: ResearchCandidate, fallback: string) {
  const text = (value ?? "")
    .replace(/\*\*/g, "")
    .replace(/^[-*\d.)\s]+/, "")
    .replace(/^Okay,\s*/i, "")
    .replace(/^Here (?:is|are)[^:]*:\s*/i, "")
    .replace(/^(summary|efficacy|protocol|setup|safety|limitations?|claim):\s*/i, "")
    .replace(/^this request asks[^.?!]*[.?!]\s*/i, "")
    .replace(/^this (?:paper|study) (?:does not|doesn't) directly test[^.?!]*[.?!]\s*/i, "")
    .replace(/^the provided ["']?paper["']? is actually\s*/i, "This evidence is ")
    .replace(/\bI cannot provide[^.?!]*[.?!]/gi, "")
    .replace(/\bI can't provide[^.?!]*[.?!]/gi, "")
    .replace(/\bthere is no direct paper evaluating[^.?!]*[.?!]/gi, "")
    .replace(/\bnot directly testing this particular [^.?!]*[.?!]/gi, "")
    .replace(/\bbased solely on the given information\b/gi, "from the available evidence")
    .trim();

  if (!text || /^therefore,?\s*$/i.test(text)) return fallback;
  if (/direct paper evaluating|not directly testing/i.test(text)) {
    return `Evidence is indirect: ${paper.title} studies the broader product category rather than this exact brand.`;
  }

  return text;
}

function buyerClaimFromSummary(product: ProductForResearch, paper: ResearchCandidate, efficacy: string) {
  const target = userBenefitTarget(product);
  const cleaned = sanitizeBuyerText(efficacy, paper, "evidence is indirect but relevant to this product category");
  const base = truncateAtWord(cleaned, 118);
  const productName = product.name.split(",")[0]?.replace(/\s+with\s+.*$/i, "").trim() || product.name;

  if (/^evidence is indirect/i.test(base)) {
    return `${productName} may fit shoppers focused on ${target}; the evidence is indirect but relevant to the broader product category.`;
  }

  return `${productName} may support ${target}; evidence suggests ${base}`;
}

async function summarizePaperWithDeepSeekText(
  product: ProductForResearch,
  paper: ResearchCandidate,
  rank: number,
  baseUrl: string,
  model: string
) {
  const data = await fetchJsonWithRetry<OllamaChatResponse>(
    `DeepSeek paper ${rank} summary`,
    `${baseUrl.replace(/\/$/, "")}/api/chat`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        stream: false,
        keep_alive: process.env.LOCAL_AI_KEEP_ALIVE || "30m",
        messages: [
          {
            role: "user",
            content:
              "Write buyer-facing evidence notes for this product in exactly five short plain-text lines. No JSON. No markdown. " +
              `Focus on the direct shopper benefit: ${userBenefitTarget(product)}. ` +
              "Use this order: Buyer benefit, Evidence signal, Use context, Safety, Limits. " +
              "Write to the shopper, not to the developer. Do not say this request, provided paper, I cannot, or not directly testing this brand. " +
              "If evidence is indirect, say the broader user outcome it supports in one short useful sentence. " +
              "For equipment, Use context means setup, position, resistance, repetitions, testing method, or fit. " +
              "For general wellness products, Use context means practical use, fit, comfort, or buying context. " +
              JSON.stringify({ product, paper })
          }
        ],
        options: {
          temperature: 0.1,
          num_ctx: envNumber("LOCAL_AI_NUM_CTX", 4096),
          num_predict: envNumber("LOCAL_AI_PAPER_NUM_PREDICT", 2048),
          num_gpu: envNumber("LOCAL_AI_NUM_GPU", 999),
          num_batch: envNumber("LOCAL_AI_NUM_BATCH", 512)
        }
      })
    },
    { retries: 1, baseDelayMs: 650 }
  );

  const lines = linesFromDeepSeekText(data.message?.content);
  if (!lines.length) return null;

  const summary = lines[0] ?? "";
  const efficacy = lines[1] ?? lines[0] ?? "";
  const dosage = lines[2] ?? "Protocol details should be checked against the paper.";
  const sideEffects = lines[3] ?? "Safety details should be checked against the paper.";
  const limitations = lines[4] ?? "The finding should be interpreted within the study design and population.";

  return {
    summary: sanitizeBuyerText(summary, paper, "This paper is relevant to the product category."),
    efficacy: sanitizeBuyerText(efficacy, paper, "Evidence is indirect but relevant to this product category."),
    dosage: sanitizeBuyerText(dosage, paper, "Use should follow product fit, comfort, and setup instructions."),
    sideEffects: sanitizeBuyerText(sideEffects, paper, "No major safety signal was extracted from the available metadata."),
    limitations: sanitizeBuyerText(limitations, paper, "Evidence may not test this exact brand or use case."),
    claim: buyerClaimFromSummary(product, paper, efficacy),
    confidence: Math.max(0.56, 0.9 - (rank - 1) * 0.06)
  } satisfies PaperSummaryPayload;
}

async function curateWithDeepSeekR1(
  product: ProductForResearch,
  candidates: ResearchCandidate[],
  baseUrl: string,
  model: string
) {
  const chosen = selectTopFive(product, candidates);
  const papers: CuratedPaper[] = [];
  const benefits: CuratedBenefit[] = [];

  for (const [index, candidate] of chosen.entries()) {
    const rank = index + 1;
    const summary = await summarizePaperWithDeepSeekText(product, candidate, rank, baseUrl, model);
    const matchConfidence = Math.max(0.56, Math.min(0.95, 0.9 - index * 0.06));

    papers.push({
      ...candidate,
      rank,
      matchConfidence,
      rationale: `Selected by evidence hierarchy and summarized with ${model}.`,
      summary:
        summary?.summary ||
        candidate.abstract?.slice(0, 360) ||
        "This paper was selected as relevant, but the local model did not return a summary.",
      efficacy:
        summary?.efficacy ||
        "Efficacy should be interpreted cautiously and checked against the original paper.",
      sideEffects:
        summary?.sideEffects ||
        "Safety and tolerability details should be checked against the full paper.",
      dosage:
        summary?.dosage ||
        "Protocol, setup, or dosage details were not clearly extracted from metadata.",
      limitations:
        summary?.limitations ||
        "Automated local summary based on available metadata; manual review is recommended."
    });

    if (summary?.claim) {
      benefits.push({
        claim: summary.claim,
        confidence:
          typeof summary.confidence === "number"
            ? Math.max(0, Math.min(1, summary.confidence))
            : matchConfidence,
        articleDoi: candidate.doi,
        articleTitle: candidate.title
      });
    }
  }

  return {
    papers,
    benefits: benefits.length
      ? benefits
      : papers.slice(0, 3).map((paper) => ({
          claim: `${product.name} may be relevant for shoppers focused on ${userBenefitTarget(product)}; this evidence still needs review before stronger claims.`,
          confidence: paper.matchConfidence,
          articleDoi: paper.doi,
          articleTitle: paper.title
        })),
    model: `ollama:${model}`
  } satisfies CuratedResearchResult;
}

async function curateWithOpenAi(product: ProductForResearch, candidates: ResearchCandidate[]) {
  const model = process.env.OPENAI_MODEL || "gpt-4o";
  const messages = aiCurationMessages(product, candidates, 30);

  const data = await fetchJsonWithRetry<OpenAiChatResponse>(
    "OpenAI curation",
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages
      })
    },
    { retries: 2 }
  );

  return curatedResultFromPayload(parseAiCurationPayload(data.choices?.[0]?.message?.content), candidates, model);
}

export async function curateTopEvidence(
  product: ProductForResearch,
  candidates: ResearchCandidate[]
): Promise<CuratedResearchResult> {
  if (!candidates.length) {
    return {
      papers: [
        {
          doi: null,
          title: `Manual research required for ${product.name}`,
          authors: ["Marketplace Research Team"],
          journal: "Internal Queue",
          publicationYear: new Date().getFullYear(),
          studyType: StudyType.OTHER,
          sampleSize: null,
          citationCount: 0,
          url: null,
          source: ResearchSource.MANUAL,
          rank: 1,
          matchConfidence: 0.2,
          rationale: "No API candidates were returned.",
          summary: "Research APIs did not return usable candidates for automated curation.",
          efficacy: "No efficacy claim should be published yet.",
          sideEffects: "No safety claim should be published yet.",
          dosage: "No dosage could be extracted.",
          limitations: "Requires manual review."
        }
      ],
      benefits: [],
      model: "empty-fallback"
    };
  }

  const provider = (process.env.AI_PROVIDER || (process.env.OPENAI_API_KEY ? "openai" : "local")).toLowerCase();

  try {
    if (provider === "openai") {
      if (!process.env.OPENAI_API_KEY) return fallbackTopFive(product, candidates);
      return (await curateWithOpenAi(product, candidates)) ?? fallbackTopFive(product, candidates);
    }

    if (provider === "local" || provider === "ollama") {
      return (await curateWithOllama(product, candidates)) ?? fallbackTopFive(product, candidates);
    }

    return fallbackTopFive(product, candidates);
  } catch (error) {
    console.error(error);
    return fallbackTopFive(product, candidates);
  }
}
