"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { easePremium } from "@/lib/motion";
import { cn } from "@/lib/utils";

type FaqItem = {
  question: string;
  answer: string;
  icon?: LucideIcon;
};

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openQuestion, setOpenQuestion] = useState(items[0]?.question ?? "");

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const open = openQuestion === item.question;
        const Icon = item.icon;

        return (
          <motion.article
            key={item.question}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-32px" }}
            transition={{ duration: 0.5, ease: easePremium, delay: index * 0.05 }}
            className={cn(
              "overflow-hidden rounded-xl border bg-card shadow-soft transition-all duration-500",
              open ? "border-primary/20 shadow-lift" : "border-border hover:border-primary/15 hover:shadow-lift"
            )}
          >
            <button
              type="button"
              onClick={() => setOpenQuestion(open ? "" : item.question)}
              className="flex w-full items-center gap-4 p-5 text-left"
              aria-expanded={open}
            >
              {Icon ? (
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors",
                    open ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
              ) : null}
              <span className="flex-1 font-semibold text-foreground">{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
                  open && "rotate-180 text-primary"
                )}
                aria-hidden
              />
            </button>
            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: easePremium }}
                  className="overflow-hidden border-t border-border/70"
                >
                  <p className={cn("p-5 text-sm leading-[1.75] text-muted-foreground", Icon ? "pl-[4.5rem]" : "")}>
                    {item.answer}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.article>
        );
      })}
    </div>
  );
}
