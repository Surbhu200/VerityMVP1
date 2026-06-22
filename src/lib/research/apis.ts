import { ResearchSource, StudyType } from "@prisma/client";
import { fetchJsonWithRetry } from "@/lib/retry";
import type { ProductForResearch, ResearchCandidate } from "@/lib/research/types";

type CrossrefResponse = {
  message?: {
    items?: Array<{
      DOI?: string;
      title?: string[];
      author?: Array<{ given?: string; family?: string }>;
      "container-title"?: string[];
      issued?: { "date-parts"?: number[][] };
      "is-referenced-by-count"?: number;
      URL?: string;
      abstract?: string;
    }>;
  };
};

type OpenAlexResponse = {
  results?: Array<{
    doi?: string;
    title?: string;
    display_name?: string;
    publication_year?: number;
    cited_by_count?: number;
    host_venue?: { display_name?: string };
    primary_location?: { source?: { display_name?: string }; landing_page_url?: string };
    authorships?: Array<{ author?: { display_name?: string } }>;
    abstract_inverted_index?: Record<string, number[]>;
  }>;
};

type SemanticScholarResponse = {
  data?: Array<{
    paperId?: string;
    externalIds?: { DOI?: string };
    title?: string;
    authors?: Array<{ name?: string }>;
    year?: number;
    venue?: string;
    citationCount?: number;
    url?: string;
    abstract?: string;
    publicationTypes?: string[];
  }>;
};

type PubMedSearchResponse = {
  esearchresult?: {
    idlist?: string[];
  };
};

type PubMedSummaryResponse = {
  result?: Record<
    string,
    | {
        uid?: string;
        title?: string;
        fulljournalname?: string;
        source?: string;
        pubdate?: string;
        sortpubdate?: string;
        authors?: Array<{ name?: string }>;
        articleids?: Array<{ idtype?: string; value?: string }>;
        pubtype?: string[];
      }
    | string[]
    | undefined
  >;
};

function researchQuery(product: ProductForResearch) {
  const cleanedName = product.name
    .replace(/\bResearch product\s+[A-Z0-9]{10}\b/gi, "")
    .replace(/\bAmazon product\s+[A-Z0-9]{10}\b/gi, "")
    .replace(/\b[A-Z0-9]{10}\b/g, "")
    .replace(/[-_,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const ingredients = Array.isArray(product.ingredients)
    ? product.ingredients
        .map((ingredient) =>
          typeof ingredient === "object" && ingredient && "name" in ingredient
            ? String((ingredient as { name?: unknown }).name)
            : ""
        )
        .filter(Boolean)
        .join(" ")
    : "";
  const description = product.description
    ?.replace(/\b[A-Z0-9]{10}\b/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 180)
    .trim();
  const category = product.category === "Research Queue" ? "" : product.category;
  const benefits = benefitTerms(product).slice(0, 5).join(" ");
  const query = [cleanedName, ingredients, category, benefits, description].filter(Boolean).join(" ");

  return query || product.name;
}

function coreProductTerms(product: ProductForResearch) {
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
        !/^(amazon|product|with|from|this|that|details|pack|count|black|white|large|small|adjustable|trainer|strengthener)$/.test(
          term
        )
    )
    .slice(0, 5);

  return Array.from(new Set([...ingredientTerms, ...titleTerms])).slice(0, 6);
}

function productText(product: ProductForResearch) {
  return `${product.name} ${product.category} ${product.description ?? ""}`.toLowerCase();
}

function hasIngredients(product: ProductForResearch) {
  return Array.isArray(product.ingredients) && product.ingredients.length > 0;
}

function isSleepMaskProduct(product: ProductForResearch) {
  return /eye mask|sleep mask|blindfold|\bmask\b|light blocking/.test(productText(product));
}

function isSleepSupplementProduct(product: ProductForResearch) {
  return /sleep|insomnia|relaxation/.test(productText(product)) && hasIngredients(product);
}

function isColdPlungeProduct(product: ProductForResearch) {
  return /cold plunge|ice bath|cold water immersion|cryotherapy|cold therapy|plunge tub|recovery tub|ice pod/.test(
    productText(product)
  );
}

function pubMedQueries(product: ProductForResearch) {
  const text = productText(product);
  const base = researchQuery(product);
  const coreTerms = coreProductTerms(product);
  const core = coreTerms.length ? coreTerms.join(" ") : base;

  if (/grip|forearm|wrist|hand/.test(text)) {
    return [
      "grip strength older adults biomarker",
      "Grip Strength: An Indispensable Biomarker For Older Adults",
      "handgrip strength aging function",
      "grip strength mobility frailty independence",
      "hand grip strength rehabilitation older adults",
      base
    ];
  }

  if (isColdPlungeProduct(product)) {
    return [
      "cold water immersion exercise recovery systematic review",
      "cold water immersion muscle soreness meta-analysis",
      "cold water immersion safety cardiovascular response",
      "cold water immersion sleep recovery athletes",
      "cryotherapy cold water immersion recovery randomized trial",
      base
    ];
  }

  if (isSleepMaskProduct(product)) {
    return [
      "sleep quality aging recovery",
      "sleep mask eye mask sleep quality",
      "circadian sleep quality older adults",
      "eye mask sleep intensive care systematic review",
      base
    ];
  }

  if (isSleepSupplementProduct(product) || (/melatonin|magnesium|glycinate|theanine|gaba/.test(text) && hasIngredients(product))) {
    return [
      `${core} sleep quality systematic review`,
      `${core} randomized controlled trial insomnia safety`,
      `${core} older adults sleep quality adverse events`,
      `${core} sleep latency clinical trial`,
      base
    ];
  }

  if (/olive|oil|polyphenol|evoo/.test(text)) {
    return [
      "extra virgin olive oil polyphenols cardiovascular aging",
      "olive oil inflammation healthy aging",
      "Mediterranean diet olive oil longevity",
      base
    ];
  }

  if (/skin|hair|beauty|satin|silk|cream|serum|lotion|sunscreen/.test(text)) {
    return [
      `${core} dermatology systematic review`,
      `${core} skin barrier randomized trial safety`,
      `${core} quality of life dermatology`,
      `${core} adverse events tolerability`,
      base
    ];
  }

  if (/massager|brace|splint|wrap|posture|support|orthopedic|orthotic|compression/.test(text)) {
    return [
      `${core} pain function systematic review`,
      `${core} mobility quality of life clinical trial`,
      `${core} older adults safety rehabilitation`,
      `${core} adverse events`,
      base
    ];
  }

  if (Array.isArray(product.ingredients) && product.ingredients.length > 0) {
    return [
      `${core} systematic review health benefits`,
      `${core} randomized controlled trial safety`,
      `${core} older adults healthy aging`,
      `${core} adverse events tolerability`,
      `${core} biomarkers clinical trial`,
      base
    ];
  }

  return [
    `${core} systematic review user benefit`,
    `${core} clinical trial safety`,
    `${core} older adults healthy aging`,
    `${core} quality of life function`,
    base
  ];
}

function benefitTerms(product: ProductForResearch) {
  const text = productText(product);

  if (isSleepMaskProduct(product)) {
    return [
      "sleep quality",
      "eye mask",
      "sleep mask",
      "light blocking",
      "sleep comfort",
      "healthy aging",
      "recovery",
      "insomnia",
      "circadian"
    ];
  }

  if (isSleepSupplementProduct(product)) {
    return [
      ...coreProductTerms(product),
      "sleep quality",
      "sleep latency",
      "insomnia",
      "safety",
      "older adults"
    ];
  }

  if (/grip|forearm|wrist|hand/.test(text)) {
    return [
      "grip strength",
      "hand function",
      "forearm training",
      "wrist position",
      "rehabilitation",
      "healthy aging",
      "functional independence",
      "dynamometer"
    ];
  }

  if (/olive|oil|polyphenol|evoo/.test(text)) {
    return [
      "extra virgin olive oil",
      "polyphenols",
      "cardiovascular markers",
      "inflammation",
      "healthy aging",
      "longevity",
      "mediterranean diet"
    ];
  }

  if (isColdPlungeProduct(product)) {
    return [
      "cold water immersion",
      "ice bath",
      "muscle soreness",
      "exercise recovery",
      "recovery",
      "cryotherapy",
      "cardiovascular response",
      "safety",
      "athletes"
    ];
  }

  return [
    "user benefit",
    "healthy aging",
    "longevity",
    "comfort",
    "safety",
    "quality",
    "clinical trial"
  ];
}

function inferStudyType(value: string | undefined | null): StudyType {
  const text = value?.toLowerCase() ?? "";

  if (text.includes("meta-analysis") || text.includes("meta analysis")) return StudyType.META_ANALYSIS;
  if (text.includes("systematic review")) return StudyType.SYSTEMATIC_REVIEW;
  if (text.includes("randomized") || text.includes("randomised") || text.includes("placebo")) {
    return StudyType.RANDOMIZED_CONTROLLED_TRIAL;
  }
  if (text.includes("cohort")) return StudyType.COHORT;
  if (text.includes("case study")) return StudyType.CASE_STUDY;
  if (text.includes("in vitro")) return StudyType.IN_VITRO;
  if (text.includes("observational")) return StudyType.OBSERVATIONAL;

  return StudyType.OTHER;
}

function normalizeDoi(doi?: string | null) {
  return doi?.replace(/^https?:\/\/doi\.org\//i, "").trim().toLowerCase() ?? null;
}

function publicationYearFromPubDate(value?: string | null) {
  const match = value?.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}

function articleIdValue(
  articleIds: Array<{ idtype?: string; value?: string }> | undefined,
  idType: string
) {
  return articleIds?.find((item) => item.idtype?.toLowerCase() === idType)?.value;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function seededPubMedCandidates(product: ProductForResearch): ResearchCandidate[] {
  const text = `${product.name} ${product.category} ${product.description ?? ""}`.toLowerCase();

  if (!/grip|forearm|wrist|hand/.test(text)) return [];

  return [
    {
      doi: "10.2147/cia.s194543",
      title: "Grip Strength: An Indispensable Biomarker For Older Adults",
      authors: ["Bohannon RW"],
      journal: "Clinical Interventions in Aging",
      publicationYear: 2019,
      studyType: StudyType.OTHER,
      sampleSize: null,
      citationCount: 0,
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6778477/",
      source: ResearchSource.MANUAL,
      abstract:
        "Review article linking grip strength to older-adult health, function, disability risk, and long-term outcomes."
    }
  ];
}

function restoreAbstract(inverted?: Record<string, number[]>) {
  if (!inverted) return null;

  const words: Array<[number, string]> = [];

  for (const [word, positions] of Object.entries(inverted)) {
    for (const position of positions) {
      words.push([position, word]);
    }
  }

  return words
    .sort(([a], [b]) => a - b)
    .map(([, word]) => word)
    .join(" ");
}

function relevanceTerms(product: ProductForResearch) {
  const text = productText(product);

  if (isColdPlungeProduct(product)) {
    return [
      "cold water immersion",
      "cold-water immersion",
      "ice bath",
      "cold plunge",
      "cryotherapy",
      "muscle soreness",
      "exercise recovery",
      "recovery",
      "cardiovascular response",
      "hydrotherapy"
    ];
  }

  if (isSleepMaskProduct(product)) {
    return ["sleep", "sleep quality", "eye mask", "sleep mask", "mask", "light", "circadian", "insomnia"];
  }

  if (isSleepSupplementProduct(product)) {
    return [...coreProductTerms(product), "sleep", "insomnia", "safety"].map((term) => term.toLowerCase());
  }

  if (/grip|forearm|wrist|hand/.test(text)) {
    return ["grip", "forearm", "wrist", "hand", "dynamometry", "strength"];
  }

  if (/olive|oil|polyphenol|evoo/.test(text)) {
    return ["olive", "oil", "polyphenol", "evoo", "mediterranean"];
  }

  return text
    .split(/\W+/)
    .filter((term) => term.length > 3 && !/^(amazon|product|research|with|from|this|that|details)$/.test(term))
    .concat(coreProductTerms(product).map((term) => term.toLowerCase()))
    .slice(0, 10);
}

function isNoisyScholarlyPage(candidate: ResearchCandidate) {
  const haystack = `${candidate.title} ${candidate.abstract ?? ""} ${candidate.journal ?? ""}`.toLowerCase();
  const abstractIdCount = (haystack.match(/abstract id/g) ?? []).length;
  const programCodeCount = (haystack.match(/program code/g) ?? []).length;

  return (
    abstractIdCount >= 3 ||
    programCodeCount >= 3 ||
    haystack.length > 8000 ||
    /table of contents|conference abstracts|annual meeting abstracts|volume \d+ issue \d+/.test(haystack) ||
    /cultural implications of china pakistan economic corridor/.test(haystack)
  );
}

function isRelevantCandidate(product: ProductForResearch, candidate: ResearchCandidate) {
  const terms = relevanceTerms(product);
  if (!terms.length) return true;

  const haystack = `${candidate.title} ${candidate.abstract ?? ""} ${candidate.journal ?? ""}`.toLowerCase();
  if (isNoisyScholarlyPage(candidate)) return false;
  if (/\bretracted\b|\bcorrection\b/.test(haystack)) return false;
  if (/\bheadache\b|\bmigraine\b/.test(haystack) && !/\bheadache\b|\bmigraine\b/.test(productText(product))) {
    return false;
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
      /\bsleep\b|sleep quality|insomnia|circadian|intensive care|icu/.test(haystack) &&
      /eye mask|sleep mask|\bmask\b|light|earplug|darkness|blindfold/.test(haystack)
    );
  }

  if (isSleepSupplementProduct(product)) {
    const ingredientHit = coreProductTerms(product).some((term) => haystack.includes(term.toLowerCase()));
    const sleepOutcomeHit = /sleep|insomnia|sleep latency|circadian/.test(haystack);
    return ingredientHit && sleepOutcomeHit;
  }

  return terms.some((term) => haystack.includes(term));
}

function foundationalDiscoverySignal(product: ProductForResearch, haystack: string) {
  const directHit =
    coreProductTerms(product).some((term) => term.length > 3 && haystack.includes(term.toLowerCase())) ||
    relevanceTerms(product).some((term) => term.length > 3 && haystack.includes(term.toLowerCase()));
  const foundationHit =
    /systematic review|meta-analysis|meta analysis|umbrella review|\breview\b|guideline|consensus|standards|biomarker|validation|reference value|normative|dose-response|safety|adverse events|tolerability/.test(
      haystack
    );
  const userOutcomeHit =
    /longevity|healthy aging|aging|older adult|older adults|cardiovascular|metabolic|inflammation|recovery|sleep quality|quality of life|mobility|function|frailty|independence|photoaging|skin barrier/.test(
      haystack
    );

  if (!directHit || !foundationHit) return 0;

  return 38 + (userOutcomeHit ? 22 : 0);
}

function directBenefitScore(product: ProductForResearch, candidate: ResearchCandidate) {
  const haystack = `${candidate.title} ${candidate.abstract ?? ""} ${candidate.journal ?? ""}`.toLowerCase();
  const title = candidate.title.toLowerCase();
  const productText = `${product.name} ${product.category} ${product.description ?? ""}`.toLowerCase();
  const benefitHits = benefitTerms(product).reduce((score, term) => score + (haystack.includes(term) ? 14 : 0), 0);
  const titleBenefitHits = benefitTerms(product).reduce((score, term) => score + (title.includes(term) ? 10 : 0), 0);
  const studyStrength =
    candidate.studyType === StudyType.META_ANALYSIS
      ? 30
      : candidate.studyType === StudyType.SYSTEMATIC_REVIEW
        ? 26
        : candidate.studyType === StudyType.RANDOMIZED_CONTROLLED_TRIAL
          ? 24
          : candidate.studyType === StudyType.COHORT
            ? 12
            : 4;
  const citationSignal = Math.min(16, Math.log10((candidate.citationCount ?? 0) + 1) * 6);
  const recentSignal = candidate.publicationYear ? Math.max(-5, (candidate.publicationYear - 2015) * 0.35) : 0;
  const offTopicPenalty = /\bretracted\b|\bcorrection\b|\beditorial\b|\bletter to\b/.test(haystack) ? -80 : 0;
  const protocolPenalty = /\bprotocol\b/.test(title) && !/\btrial\b|\bstudy\b/.test(title) ? -18 : 0;
  const sleepDirectness =
    isSleepMaskProduct(product) &&
    /sleep quality|eye mask|sleep mask|light exposure|earplug|icu|intensive care/.test(haystack)
      ? 22
      : 0;
  const gripDirectness =
    /grip|forearm|wrist|hand/.test(productText) &&
    /grip strength|handgrip|forearm|wrist|dynamometer|rehabilitation|training|healthy aging|frailty|function|independence/.test(haystack)
      ? 22
      : 0;
  const olderAdultGripSignal =
    /grip|forearm|wrist|hand/.test(productText) &&
    /older adult|older adults|aging|aged|biomarker|successful aging|cognitive function|longitudinal|mortality|disability/.test(
      haystack
    )
      ? 42
      : 0;
  const gripBiomarkerReviewSignal =
    /grip|forearm|wrist|hand/.test(productText) &&
    /indispensable biomarker|grip strength.*biomarker|biomarker.*grip strength|successful aging|longitudinal associations/.test(
      haystack
    )
      ? 78
      : 0;
  const longevitySignal =
    /longevity|healthy aging|aging|older adult|older adults|cardiovascular|metabolic|inflammation|recovery|sleep quality|function|mobility|frailty|independence|quality of life/.test(
      haystack
    )
      ? 16
      : 0;
  const coreTermSignal =
    coreProductTerms(product).some((term) => haystack.includes(term.toLowerCase())) &&
    /systematic review|meta-analysis|randomized|clinical trial|older adult|older adults|healthy aging|longevity|quality of life|function|safety|adverse events|biomarker|cardiovascular|metabolic|inflammation|recovery/.test(
      haystack
    )
      ? 24
      : 0;
  const coldPlungeSignal =
    isColdPlungeProduct(product) &&
    /cold water immersion|cold-water immersion|ice bath|cold plunge|cryotherapy|hydrotherapy|cold therapy/.test(
      haystack
    ) &&
    /recovery|muscle soreness|exercise|athlete|cardiovascular|safety|sleep|inflammation|performance/.test(haystack)
      ? 68
      : 0;
  const foundationalSignal = foundationalDiscoverySignal(product, haystack);

  return (
    benefitHits +
    titleBenefitHits +
    studyStrength +
    citationSignal +
    recentSignal +
    sleepDirectness +
    gripDirectness +
    olderAdultGripSignal +
    gripBiomarkerReviewSignal +
    longevitySignal +
    coreTermSignal +
    coldPlungeSignal +
    foundationalSignal +
    offTopicPenalty +
    protocolPenalty
  );
}

export async function searchCrossref(product: ProductForResearch): Promise<ResearchCandidate[]> {
  const params = new URLSearchParams({
    query: researchQuery(product),
    rows: "12",
    sort: "relevance"
  });

  if (process.env.CROSSREF_MAILTO) {
    params.set("mailto", process.env.CROSSREF_MAILTO);
  }

  try {
    const data = await fetchJsonWithRetry<CrossrefResponse>(
      "Crossref search",
      `https://api.crossref.org/works?${params.toString()}`
    );

    return (
      data.message?.items?.map((item) => {
        const title = item.title?.[0] ?? "Untitled Crossref result";
        const abstract = item.abstract?.replace(/<[^>]+>/g, " ") ?? null;

        return {
          doi: normalizeDoi(item.DOI),
          title,
          authors:
            item.author?.map((author) => [author.given, author.family].filter(Boolean).join(" ")) ?? [],
          journal: item["container-title"]?.[0],
          publicationYear: item.issued?.["date-parts"]?.[0]?.[0],
          studyType: inferStudyType(`${title} ${abstract ?? ""}`),
          sampleSize: null,
          citationCount: item["is-referenced-by-count"] ?? 0,
          url: item.URL,
          source: ResearchSource.CROSSREF,
          abstract
        };
      }) ?? []
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function searchOpenAlex(product: ProductForResearch): Promise<ResearchCandidate[]> {
  const params = new URLSearchParams({
    search: researchQuery(product),
    per_page: "12",
    sort: "relevance_score:desc"
  });

  try {
    const data = await fetchJsonWithRetry<OpenAlexResponse>(
      "OpenAlex search",
      `https://api.openalex.org/works?${params.toString()}`
    );

    return (
      data.results?.map((item) => {
        const title = item.title ?? item.display_name ?? "Untitled OpenAlex result";
        const abstract = restoreAbstract(item.abstract_inverted_index);

        return {
          doi: normalizeDoi(item.doi),
          title,
          authors: item.authorships?.map((author) => author.author?.display_name ?? "").filter(Boolean) ?? [],
          journal: item.primary_location?.source?.display_name ?? item.host_venue?.display_name,
          publicationYear: item.publication_year,
          studyType: inferStudyType(`${title} ${abstract ?? ""}`),
          sampleSize: null,
          citationCount: item.cited_by_count ?? 0,
          url: item.primary_location?.landing_page_url ?? item.doi,
          source: ResearchSource.OPENALEX,
          abstract
        };
      }) ?? []
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function searchSemanticScholar(product: ProductForResearch): Promise<ResearchCandidate[]> {
  if (!process.env.SEMANTIC_SCHOLAR_API_KEY && process.env.SEMANTIC_SCHOLAR_DISABLE_ANON !== "false") {
    return [];
  }

  const params = new URLSearchParams({
    query: researchQuery(product),
    limit: "12",
    fields: "title,authors,year,venue,citationCount,url,abstract,externalIds,publicationTypes"
  });

  try {
    const data = await fetchJsonWithRetry<SemanticScholarResponse>(
      "Semantic Scholar search",
      `https://api.semanticscholar.org/graph/v1/paper/search?${params.toString()}`,
      {
        headers: {
          ...(process.env.SEMANTIC_SCHOLAR_API_KEY
            ? { "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY }
            : {})
        }
      }
    );

    return (
      data.data?.map((item) => {
        const title = item.title ?? "Untitled Semantic Scholar result";
        const publicationTypes = item.publicationTypes?.join(" ") ?? "";

        return {
          doi: normalizeDoi(item.externalIds?.DOI),
          title,
          authors: item.authors?.map((author) => author.name ?? "").filter(Boolean) ?? [],
          journal: item.venue,
          publicationYear: item.year,
          studyType: inferStudyType(`${title} ${publicationTypes} ${item.abstract ?? ""}`),
          sampleSize: null,
          citationCount: item.citationCount ?? 0,
          url: item.url,
          source: ResearchSource.SEMANTIC_SCHOLAR,
          abstract: item.abstract
        };
      }) ?? []
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function searchPubMed(product: ProductForResearch): Promise<ResearchCandidate[]> {
  try {
    const idSet = new Set<string>();
    const focusedQueries = pubMedQueries(product);
    const maxQueries = process.env.NCBI_API_KEY ? focusedQueries.length : Math.min(3, focusedQueries.length);

    for (const [index, term] of focusedQueries.slice(0, maxQueries).entries()) {
      if (index > 0) await sleep(process.env.NCBI_API_KEY ? 120 : 420);
      const searchParams = new URLSearchParams({
        db: "pubmed",
        retmode: "json",
        retmax: "5",
        sort: "relevance",
        term
      });

      if (process.env.NCBI_API_KEY) searchParams.set("api_key", process.env.NCBI_API_KEY);
      if (process.env.CROSSREF_MAILTO) searchParams.set("email", process.env.CROSSREF_MAILTO);

      const search = await fetchJsonWithRetry<PubMedSearchResponse>(
        "PubMed search",
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${searchParams.toString()}`
      );

      for (const id of search.esearchresult?.idlist ?? []) {
        if (id) idSet.add(id);
        if (idSet.size >= 16) break;
      }

      if (idSet.size >= 16) break;
    }

    const ids = Array.from(idSet).slice(0, 16);
    if (!ids.length) return seededPubMedCandidates(product);

    const summaryParams = new URLSearchParams({
      db: "pubmed",
      retmode: "json",
      id: ids.join(",")
    });

    if (process.env.NCBI_API_KEY) summaryParams.set("api_key", process.env.NCBI_API_KEY);
    if (process.env.CROSSREF_MAILTO) summaryParams.set("email", process.env.CROSSREF_MAILTO);

    const summary = await fetchJsonWithRetry<PubMedSummaryResponse>(
      "PubMed summary",
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${summaryParams.toString()}`
    );

    const candidates = ids
      .map((id) => {
        const item = summary.result?.[id];
        if (!item || Array.isArray(item)) return null;

        const title = item.title?.replace(/\.$/, "").trim() || "Untitled PubMed result";
        const doi = normalizeDoi(articleIdValue(item.articleids, "doi"));
        const pmcid = articleIdValue(item.articleids, "pmc");
        const pmid = item.uid ?? id;

        return {
          doi,
          title,
          authors: item.authors?.map((author) => author.name ?? "").filter(Boolean) ?? [],
          journal: item.fulljournalname ?? item.source,
          publicationYear: publicationYearFromPubDate(item.pubdate ?? item.sortpubdate),
          studyType: inferStudyType(`${title} ${item.pubtype?.join(" ") ?? ""}`),
          sampleSize: null,
          citationCount: 0,
          url: pmcid
            ? `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`
            : `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          source: ResearchSource.MANUAL,
          abstract: item.pubtype?.join("; ") ?? null
        } satisfies ResearchCandidate;
      })
      .filter(Boolean) as ResearchCandidate[];

    return dedupeCandidates([...seededPubMedCandidates(product), ...candidates]);
  } catch (error) {
    console.error(error);
    return seededPubMedCandidates(product);
  }
}

export async function discoverCandidateArticles(product: ProductForResearch) {
  const results = await Promise.allSettled([
    searchPubMed(product),
    searchCrossref(product),
    searchOpenAlex(product),
    searchSemanticScholar(product)
  ]);

  return dedupeCandidates(results.flatMap((result) => (result.status === "fulfilled" ? result.value : [])))
    .filter((candidate) => isRelevantCandidate(product, candidate))
    .sort((a, b) => directBenefitScore(product, b) - directBenefitScore(product, a));
}

export function dedupeCandidates(candidates: ResearchCandidate[]) {
  const byKey = new Map<string, ResearchCandidate>();

  for (const candidate of candidates) {
    const key =
      normalizeDoi(candidate.doi) ??
      candidate.url?.toLowerCase() ??
      candidate.title.toLowerCase().replace(/\W+/g, " ").trim();
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, candidate);
      continue;
    }

    byKey.set(key, {
      ...existing,
      authors: existing.authors.length ? existing.authors : candidate.authors,
      journal: existing.journal ?? candidate.journal,
      publicationYear: existing.publicationYear ?? candidate.publicationYear,
      sampleSize: existing.sampleSize ?? candidate.sampleSize,
      citationCount: Math.max(existing.citationCount ?? 0, candidate.citationCount ?? 0),
      abstract: existing.abstract ?? candidate.abstract,
      source: existing.source
    });
  }

  return Array.from(byKey.values());
}
