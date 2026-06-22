import { Activity, BadgeDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type ScoreBadgeProps = {
  label: string;
  score: number;
  grade: string;
  tone: "health" | "value";
};

export function ScoreBadge({ label, score, grade, tone }: ScoreBadgeProps) {
  const Icon = tone === "health" ? Activity : BadgeDollarSign;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 shadow-soft",
        tone === "health" ? "border-moss/20 bg-mint/48" : "border-honey/30 bg-honey/14"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-ink/60">{label}</p>
          <p className="mt-1 text-3xl font-bold">{score}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-md bg-porcelain text-ink">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink/10">
        <div
          className={cn("h-full rounded-full", tone === "health" ? "bg-coral" : "bg-honey")}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="mt-3 text-sm font-medium text-ink/70">{grade}</p>
    </div>
  );
}
