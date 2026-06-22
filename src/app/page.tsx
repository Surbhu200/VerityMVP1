import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Database, FileSearch, Layers, Leaf, Quote, ShieldCheck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ScorePill } from "@/components/score-pill";
import { Reveal, Stagger, StaggerItem } from "@/components/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFeatureCard } from "@/components/ui/icon-feature-card";
import { SectionHeader } from "@/components/ui/section-header";
import { getFeaturedProducts } from "@/lib/products";
import { formatCurrency } from "@/lib/utils";

export default async function HomePage() {
  const products = await getFeaturedProducts();
  const featured = products[0];

  return (
    <main className="pb-20">
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <Badge variant="evidence" className="gap-1.5">
                <Leaf className="h-3.5 w-3.5" aria-hidden />
                Evidence-first marketplace
              </Badge>
              <h1 className="mt-5 font-display text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Health products with citations you can verify.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-[1.75] text-muted-foreground">
                Verity fights wellness misinformation by tying every claim to indexed research. Scan Evidence and
                Product Fit scores first — expand direct quotes and source papers only when you need them.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={`/products/${featured.id}`}>
                    Review featured product
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/how-it-works">
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                    How scoring works
                  </Link>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <Card className="overflow-hidden shadow-soft transition-shadow duration-500 hover:shadow-lift">
                <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                  <div className="relative aspect-[4/3] bg-muted sm:aspect-auto sm:min-h-[260px]">
                    {featured.imageUrls[0] ? (
                      <Image
                        src={featured.imageUrls[0]}
                        alt={featured.name}
                        fill
                        priority
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-col justify-between gap-4 p-4 sm:p-5">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                        {featured.category}
                      </p>
                      <h2 className="mt-1.5 line-clamp-2 font-display text-lg font-semibold sm:text-xl">{featured.name}</h2>
                      <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                        {formatCurrency(featured.price, featured.currency)}
                      </p>
                    </div>
                    <div className="grid min-w-0 grid-cols-2 gap-2">
                      <ScorePill
                        label="Evidence"
                        score={featured.score?.healthScore ?? 0}
                        highlight={(featured.score?.healthScore ?? 0) >= 75}
                        variant="mini"
                      />
                      <ScorePill label="Fit" score={featured.score?.valueScore ?? 0} variant="mini" />
                    </div>
                  </div>
                </div>
              </Card>
            </Reveal>
          </div>

          <Stagger className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Database, label: "3 research APIs aggregated", value: "Indexed sources" },
              { icon: Quote, label: "Claims tied to excerpts", value: "Direct citations" },
              { icon: FileSearch, label: "Scores stay honest", value: "No inflated ratings" }
            ].map((item) => (
              <StaggerItem key={item.label}>
                <Card className="transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lift">
                  <CardHeader className="pb-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <CardTitle className="mt-4 text-base font-semibold">{item.value}</CardTitle>
                    <CardDescription className="leading-[1.75]">{item.label}</CardDescription>
                  </CardHeader>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeader
            icon={Layers}
            eyebrow="Marketplace"
            title="Products with receipts"
            description="Each listing leads with Evidence and Product Fit scores, then links every claim to a verifiable paper."
            action={
              <Button asChild variant="outline" className="shrink-0">
                <Link href="/how-it-works">Scoring method</Link>
              </Button>
            }
            className="mb-10"
          />
        </Reveal>
        <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <StaggerItem key={product.id}>
              <ProductCard product={product} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="border-t border-border/60 bg-muted/25">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <SectionHeader
              icon={ShieldCheck}
              eyebrow="Why Verity"
              title="Built for trust, not hype"
              description="Direct research excerpts and source metadata — not generic AI paragraphs. High Evidence Scores earn a deliberate pop of color."
            />
          </Reveal>
          <Stagger className="grid gap-4">
            {[
              {
                icon: FileSearch,
                title: "Citation chips on every claim",
                body: "Each benefit shows which paper supports it, with match scores and one-click access to the original study."
              },
              {
                icon: Layers,
                title: "Dual-score transparency",
                body: "Evidence Score and Product Fit Score are separated so strong science isn't confused with a bad listing."
              },
              {
                icon: Quote,
                title: "Progressive disclosure",
                body: "Casual buyers get the verdict in seconds. Researchers expand accordions for protocols, limitations, and full quotes."
              }
            ].map((item) => (
              <StaggerItem key={item.title}>
                <IconFeatureCard icon={item.icon} title={item.title} description={item.body} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </main>
  );
}
