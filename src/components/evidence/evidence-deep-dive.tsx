"use client";

import { BarChart3, FlaskConical, ShieldAlert, ShieldCheck, Stethoscope } from "lucide-react";
import { AISummary } from "@/components/evidence/ai-summary";
import { PaperProtocolDialog } from "@/components/evidence/paper-protocol-dialog";
import { VerifiedQuote } from "@/components/evidence/verified-quote";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CitationChip } from "@/components/citation-chip";
import { SectionHeader } from "@/components/ui/section-header";
import { paperMatchLabel, PAPER_MATCH_EXPLANATION } from "@/lib/product-verdict";
import { productKind, studyLabel } from "@/lib/product-helpers";
import type { MarketplaceProduct } from "@/lib/products";

type EvidenceDeepDiveProps = {
  product: MarketplaceProduct;
  className?: string;
};

export function EvidenceDeepDive({ product, className }: EvidenceDeepDiveProps) {
  const kind = productKind(product);
  const isSupplement = kind === "supplement";

  return (
    <section className={className}>
      <SectionHeader
        eyebrow="Evidence deep dive"
        title="Inspect the papers behind the scores"
        description="Expand each study for AI-readable summaries, database extracts, and protocol context. Evidence Score reflects benefit research; Product Fit reflects practical alignment."
        icon={ShieldCheck}
      />

      <Accordion type="single" defaultValue={product.research[0]?.id} className="mt-8">
        {product.research.map((paper) => (
          <AccordionItem key={paper.id} value={paper.id}>
            <AccordionTrigger value={paper.id}>
              <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-accent">
                  <BarChart3 className="h-3.5 w-3.5" aria-hidden />#{paper.rank}
                </span>
                <span className="font-display text-base text-primary">{paper.article.title}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent value={paper.id}>
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  {studyLabel(paper.article.studyType)} · {paper.article.journal} · {paper.article.publicationYear} · {paperMatchLabel(paper.matchConfidence)}
                </p>

                {paper.summary?.summary ? (
                  <AISummary
                    citations={[
                      {
                        index: paper.rank,
                        chip: {
                          rank: paper.rank,
                          journal: paper.article.journal,
                          year: paper.article.publicationYear,
                          matchLabel: paperMatchLabel(paper.matchConfidence),
                          href: paper.article.url
                        }
                      }
                    ]}
                  >
                    {paper.summary.summary}
                  </AISummary>
                ) : null}

                {paper.summary?.efficacy ? (
                  <VerifiedQuote
                    quote={paper.summary.efficacy}
                    label="Efficacy extract"
                    citation={{
                      rank: paper.rank,
                      journal: paper.article.journal,
                      year: paper.article.publicationYear,
                      matchLabel: paperMatchLabel(paper.matchConfidence),
                      href: paper.article.url
                    }}
                  />
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <PaperProtocolDialog paper={paper} isSupplement={isSupplement} layoutIdPrefix={`protocol-${product.id}`} />
                  <CitationChip
                    rank={paper.rank}
                    journal={paper.article.journal}
                    year={paper.article.publicationYear}
                    matchLabel={paperMatchLabel(paper.matchConfidence)}
                    href={paper.article.url}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-sage/15 p-3 text-sm">
                    <div className="flex items-center gap-2 font-semibold text-primary">
                      <FlaskConical className="h-4 w-4 text-accent" aria-hidden />
                      {isSupplement ? "Dose context" : "Protocol"}
                    </div>
                    <p className="mt-2 text-muted-foreground">{paper.summary?.dosage ?? "Pending curation."}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <div className="flex items-center gap-2 font-semibold text-primary">
                      <ShieldAlert className="h-4 w-4 text-accent" aria-hidden />
                      Side effects
                    </div>
                    <p className="mt-2 text-muted-foreground">{paper.summary?.sideEffects ?? "Not reported in summary."}</p>
                  </div>
                </div>

                <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                  <Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {PAPER_MATCH_EXPLANATION}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}