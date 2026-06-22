"use client";

import { CircleHelp, Link2, Scale, ServerCrash, Stethoscope } from "lucide-react";
import { FaqAccordion } from "@/components/faq-accordion";
import { Reveal } from "@/components/reveal";
import { PageHero } from "@/components/ui/page-hero";

const faqItems = [
  {
    icon: Link2,
    question: "How are affiliate links handled?",
    answer:
      "Products may use Amazon affiliate links, and the disclosure stays near the checkout action. The commerce layer does not change the research scoring inputs, paper selection, or benefit mapping."
  },
  {
    icon: Stethoscope,
    question: "Is this medical advice?",
    answer:
      "No. Product pages summarize research and evidence quality for education. They do not diagnose, treat, cure, or prevent disease, and they should not replace advice from a qualified clinician."
  },
  {
    icon: Scale,
    question: "How is the Evidence Score calculated?",
    answer:
      "The score weighs the top matched papers by study quality, user-outcome relevance, publication recency, product-match confidence, and product-specific quality signals."
  },
  {
    icon: Scale,
    question: "How is the Product Fit Score calculated?",
    answer:
      "The score asks whether the listing is a strong practical choice after evidence-backed benefit, product quality, dose or use-case fit, and price context are considered."
  },
  {
    icon: ServerCrash,
    question: "What happens if APIs fail?",
    answer:
      "External calls use retry and exponential backoff. If research APIs or AI curation are unavailable, the job records the failure or falls back to conservative metadata ranking."
  }
];

export function FaqSection() {
  return (
    <main className="pb-20">
      <PageHero
        icon={CircleHelp}
        eyebrow="FAQ"
        title="Clear answers, no hand-waving."
        description="Transparent evidence, clear affiliate handling, and cautious health communication."
      />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal>
          <FaqAccordion items={faqItems} />
        </Reveal>
      </section>
    </main>
  );
}
