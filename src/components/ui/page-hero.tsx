import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/reveal";

type Stat = { icon: LucideIcon; label: string; value: string };

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  secondary?: string;
  icon?: LucideIcon;
  stats?: Stat[];
};

export function PageHero({ eyebrow, title, description, secondary, icon: Icon, stats }: PageHeroProps) {
  return (
    <section className="border-b border-border/60 bg-gradient-to-b from-sage/30 to-transparent">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex items-center gap-2.5">
            {Icon ? (
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
            ) : null}
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
          </div>
          <h1 className="mt-4 font-display text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-[1.75] text-muted-foreground">{description}</p>
          {secondary ? (
            <p className="mt-4 max-w-3xl text-base leading-[1.7] text-muted-foreground/90">{secondary}</p>
          ) : null}
          {stats?.length ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 rounded-xl border border-border/80 bg-card/80 px-4 py-3 shadow-soft"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                    <stat.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-sm font-semibold text-foreground">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
