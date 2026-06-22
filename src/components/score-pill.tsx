"use client";

import type { LucideIcon } from "lucide-react";
import { ScoreVisual } from "@/components/score-visual";
import { cn } from "@/lib/utils";

type ScorePillProps = {
  label: string;
  score: number;
  grade?: string;
  highlight?: boolean;
  icon?: LucideIcon;
  className?: string;
  delay?: number;
  variant?: "hero" | "card" | "compact" | "mini";
};

export function ScorePill({
  label,
  score,
  grade,
  highlight,
  icon,
  className,
  delay = 0,
  variant = "card"
}: ScorePillProps) {
  return (
    <ScoreVisual
      label={label}
      score={score}
      grade={grade}
      highlight={highlight}
      icon={icon}
      variant={variant}
      className={cn(className)}
      delay={delay}
    />
  );
}
