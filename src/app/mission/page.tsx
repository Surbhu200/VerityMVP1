import { ClipboardCheck, HeartHandshake, Scale, ShieldCheck, Siren, Stethoscope, Target } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/reveal";
import { IconFeatureCard } from "@/components/ui/icon-feature-card";
import { PageHero } from "@/components/ui/page-hero";
import { SectionHeader } from "@/components/ui/section-header";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Evidence before commerce",
    body: "Listings become publishable only after they have research links, summaries, benefits, scores, and affiliate disclosures."
  },
  {
    icon: Siren,
    title: "Claims stay narrow",
    body: "Benefits are mapped to specific papers and written to avoid disease-treatment promises the evidence cannot support."
  },
  {
    icon: Stethoscope,
    title: "Human review matters",
    body: "AI accelerates sorting and summarization; clinical and regulatory review should approve final public claims before scale."
  }
];

const principles = [
  {
    icon: ClipboardCheck,
    title: "Every claim needs a trail",
    body: "Consumer-facing benefits connect to one of the selected papers, not broad ingredient folklore."
  },
  {
    icon: Scale,
    title: "Uncertainty is part of the UI",
    body: "Limitations, side effects, sample size, and dosage context are shown because informed decisions require friction in the right places."
  }
];

export default function MissionPage() {
  return (
    <main className="pb-20">
      <PageHero
        icon={HeartHandshake}
        eyebrow="Mission"
        title="Fight misinformation with receipts."
        description="Verity is built for people who want health products without the fog of vague claims. Every product page shows what is known, what is uncertain, and where the evidence came from."
        stats={[
          { icon: ShieldCheck, label: "Standard", value: "Citation-first" },
          { icon: Target, label: "Goal", value: "Trust at scale" },
          { icon: Scale, label: "Approach", value: "Honest uncertainty" }
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal className="mb-8">
          <SectionHeader
            icon={ShieldCheck}
            eyebrow="Core pillars"
            title="What we optimize for"
            description="Three non-negotiables that shape every product page and scoring decision."
          />
        </Reveal>
        <Stagger className="grid gap-5 md:grid-cols-3">
          {pillars.map((item) => (
            <StaggerItem key={item.title}>
              <IconFeatureCard icon={item.icon} title={item.title} description={item.body} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="border-y border-border/60 bg-muted/25">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <SectionHeader
              icon={Scale}
              eyebrow="Operating principles"
              title="Persuasive without being careless."
              description="No disease-treatment claims, no hidden scoring formulas, no citation theater, and no affiliate ambiguity."
            />
          </Reveal>
          <Stagger className="grid gap-4 sm:grid-cols-2">
            {principles.map((item) => (
              <StaggerItem key={item.title}>
                <IconFeatureCard icon={item.icon} title={item.title} description={item.body} className="bg-card/80" />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </main>
  );
}
