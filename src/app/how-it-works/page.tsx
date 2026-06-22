import { BrainCircuit, Calculator, DatabaseZap, FileCheck2, GitBranch, Layers, Link2 } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/reveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFeatureCard } from "@/components/ui/icon-feature-card";
import { PageHero } from "@/components/ui/page-hero";
import { SectionHeader } from "@/components/ui/section-header";

const steps = [
  {
    icon: Link2,
    title: "Affiliate ingestion",
    body: "An admin pastes a regular Amazon product link, the ASIN is extracted, and product details are pulled from the configured product-data provider."
  },
  {
    icon: DatabaseZap,
    title: "Research aggregation",
    body: "PubMed/PMC, Crossref, OpenAlex, and Semantic Scholar are queried, deduped by DOI, and normalized into one evidence candidate set."
  },
  {
    icon: BrainCircuit,
    title: "AI curation",
    body: "The AI engine selects the five most relevant papers, summarizes efficacy, dosage, side effects, and limitations, then maps benefits to citations."
  },
  {
    icon: Calculator,
    title: "Score calculation",
    body: "Evidence Score weighs study quality, outcome relevance, recency, and claim match. Product Fit Score adds price, dose, and practical-use context."
  },
  {
    icon: FileCheck2,
    title: "Publishable listing",
    body: "A transparent marketplace page with science badges, verified benefits, evidence accordions, and affiliate disclosure."
  }
];

export default function HowItWorksPage() {
  return (
    <main className="pb-20">
      <PageHero
        icon={GitBranch}
        eyebrow="How it works"
        title="A transparent research pipeline."
        description="Product ingestion, evidence discovery, AI review, scoring, and publishing stay separated so heavy research never blocks the admin experience."
        stats={[
          { icon: DatabaseZap, label: "APIs", value: "4 indexed sources" },
          { icon: BrainCircuit, label: "Curation", value: "Top 5 papers" },
          { icon: Calculator, label: "Scores", value: "Evidence + Fit" }
        ]}
      />

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal className="mb-8">
          <SectionHeader
            icon={Layers}
            eyebrow="Pipeline"
            title="Five stages from link to listing"
            description="Each stage is isolated so failures are visible and listings never publish on weak evidence."
          />
        </Reveal>

        <Stagger className="space-y-5">
          {steps.map((step, index) => (
            <StaggerItem key={step.title}>
              <Card className="transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lift">
                <div className="grid gap-4 p-5 sm:grid-cols-[88px_1fr]">
                  <div className="flex flex-col items-start gap-2">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                      <step.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                      Step {index + 1}
                    </span>
                  </div>
                  <CardHeader className="p-0">
                    <CardTitle className="font-display text-xl font-semibold">{step.title}</CardTitle>
                    <CardContent className="mt-3 p-0 text-sm leading-[1.75] text-muted-foreground">{step.body}</CardContent>
                  </CardHeader>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-12">
          <IconFeatureCard
            icon={FileCheck2}
            title="What buyers see on each product page"
            description="Evidence and Product Fit scores up front, a plain-English bottom line, citation-tethered AI summaries, and expandable deep dives into protocols and limitations."
            className="border-primary/12 bg-gradient-to-br from-sage/50 to-card"
          />
        </Reveal>
      </section>
    </main>
  );
}
