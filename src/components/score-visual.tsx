"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ShieldCheck, Target } from "lucide-react";
import { easePremium, springSnappy } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ScoreVisualProps = {
  label: string;
  score: number;
  grade?: string;
  highlight?: boolean;
  icon?: LucideIcon;
  variant?: "hero" | "card" | "compact" | "mini";
  className?: string;
  delay?: number;
};

function ScoreRingGraphic({
  score,
  size,
  showPop,
  Icon,
  delay = 0,
  showIcon = true
}: {
  score: number;
  size: "xs" | "sm" | "md" | "lg";
  showPop: boolean;
  Icon: LucideIcon;
  delay?: number;
  showIcon?: boolean;
}) {
  const dims = { xs: 44, sm: 52, md: 68, lg: 92 }[size];
  const stroke = { xs: 4, sm: 5, md: 6, lg: 7 }[size];
  const radius = (dims - stroke) / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = dims / 2;

  return (
    <div className="relative shrink-0" style={{ width: dims, height: dims }}>
      <svg width={dims} height={dims} className="-rotate-90" aria-hidden>
        <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted/80" />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={showPop ? "stroke-accent" : "stroke-primary"}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: easePremium, delay: delay + 0.1 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          {showIcon && size !== "xs" ? (
            <Icon
              className={cn(
                "mx-auto",
                showPop ? "text-accent" : "text-primary",
                size === "lg" ? "h-4 w-4" : "h-3 w-3"
              )}
              aria-hidden
            />
          ) : null}
          <motion.p
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springSnappy, delay: delay + 0.15 }}
            className={cn(
              "font-display font-bold tabular-nums leading-none",
              showPop ? "text-accent" : "text-primary",
              size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : size === "sm" ? "text-base" : "text-sm"
            )}
          >
            {score}
          </motion.p>
        </div>
      </div>
    </div>
  );
}

function ScoreMeterBar({ score, showPop, delay = 0 }: { score: number; showPop: boolean; delay?: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.9, ease: easePremium, delay: delay + 0.2 }}
        className={cn(
          "h-full rounded-full",
          showPop ? "bg-gradient-to-r from-accent/80 to-accent" : "bg-gradient-to-r from-primary/70 to-primary"
        )}
      />
    </div>
  );
}

export function ScoreVisual({
  label,
  score,
  grade,
  highlight,
  icon,
  variant = "card",
  className,
  delay = 0
}: ScoreVisualProps) {
  const isHigh = score >= 75;
  const showPop = highlight ?? isHigh;
  const Icon = icon ?? (label.toLowerCase().includes("fit") ? Target : ShieldCheck);
  const ringSize = variant === "hero" ? "lg" : variant === "mini" ? "xs" : variant === "compact" ? "sm" : "md";

  if (variant === "mini") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springSnappy, delay }}
        className={cn(
          "flex min-w-0 flex-col items-center rounded-xl border border-border/50 bg-card/80 p-2 shadow-sm",
          showPop ? "ring-1 ring-accent/12" : "",
          className
        )}
      >
        <ScoreRingGraphic score={score} size="xs" showPop={showPop} Icon={Icon} delay={delay} showIcon={false} />
        <p className="mt-1.5 w-full truncate text-center text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springSnappy, delay }}
      className={cn(
        "min-w-0 rounded-2xl border border-border/50 bg-card/90 shadow-sm backdrop-blur-sm transition-all duration-300",
        variant !== "compact" && "hover:-translate-y-1 hover:shadow-md",
        showPop ? "ring-1 ring-accent/15 bg-gradient-to-br from-accent/[0.04] via-card to-card" : "",
        variant === "hero" ? "p-5 sm:p-6" : variant === "compact" ? "p-2.5" : "p-5",
        className
      )}
    >
      <div className={cn("flex min-w-0 gap-3", variant === "compact" ? "items-center" : "items-start sm:gap-4")}>
        <ScoreRingGraphic score={score} size={ringSize} showPop={showPop} Icon={Icon} delay={delay} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
          {grade && variant !== "compact" ? (
            <p className={cn("mt-1 truncate font-semibold text-sm", showPop ? "text-accent" : "text-primary")}>
              {grade}
            </p>
          ) : null}
          {variant === "compact" ? (
            <div className="mt-2">
              <ScoreMeterBar score={score} showPop={showPop} delay={delay} />
            </div>
          ) : (
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[10px] font-medium tabular-nums text-muted-foreground">
                <span>0</span>
                <span>{score}/100</span>
              </div>
              <ScoreMeterBar score={score} showPop={showPop} delay={delay} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
