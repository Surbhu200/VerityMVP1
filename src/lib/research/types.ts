import type { ResearchSource, StudyType } from "@prisma/client";

export type ProductForResearch = {
  id: string;
  name: string;
  brand?: string | null;
  category: string;
  description?: string | null;
  ingredients: unknown;
  price?: number | null;
};

export type ResearchCandidate = {
  doi?: string | null;
  title: string;
  authors: string[];
  journal?: string | null;
  publicationYear?: number | null;
  studyType: StudyType;
  sampleSize?: number | null;
  citationCount?: number | null;
  url?: string | null;
  source: ResearchSource;
  abstract?: string | null;
};

export type CuratedPaper = ResearchCandidate & {
  rank: number;
  matchConfidence: number;
  rationale: string;
  summary: string;
  efficacy: string;
  sideEffects: string;
  dosage: string;
  limitations: string;
};

export type CuratedBenefit = {
  claim: string;
  confidence: number;
  articleDoi?: string | null;
  articleTitle?: string;
};

export type CuratedResearchResult = {
  papers: CuratedPaper[];
  benefits: CuratedBenefit[];
  model: string;
};
