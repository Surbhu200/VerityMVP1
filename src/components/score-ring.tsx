"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ScoreRingProps = {
  score: number;
  label: string;
  grade: string;
  className?: string;
};

export function ScoreRing({ score, label, grade, className }: ScoreRingProps) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-ink/10"
          />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            className="text-coral drop-shadow-[0_0_18px_rgba(220,38,38,0.35)]"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-3xl font-black leading-none">{score}</p>
            <p className="mt-1 text-[10px] font-bold uppercase text-ink/48">of 100</p>
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase text-coral">{label}</p>
        <p className="mt-1 text-xl font-bold">{grade}</p>
        <p className="mt-2 max-w-44 text-sm leading-6 text-ink/60">A decision signal built from research and product fit.</p>
      </div>
    </div>
  );
}
