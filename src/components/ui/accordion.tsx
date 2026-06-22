"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { easePremium } from "@/lib/motion";
import { cn } from "@/lib/utils";

type AccordionContextValue = {
  openItems: string[];
  toggle: (value: string) => void;
  type: "single" | "multiple";
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("Accordion components must be used within Accordion");
  return ctx;
}

type AccordionProps = {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  className?: string;
  children: React.ReactNode;
};

export function Accordion({ type = "single", defaultValue, className, children }: AccordionProps) {
  const initial = React.useMemo(() => {
    if (defaultValue == null) return [] as string[];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  }, [defaultValue]);

  const [openItems, setOpenItems] = React.useState<string[]>(initial);

  const toggle = React.useCallback(
    (value: string) => {
      setOpenItems((current) => {
        const isOpen = current.includes(value);
        if (type === "multiple") {
          return isOpen ? current.filter((item) => item !== value) : [...current, value];
        }
        return isOpen ? [] : [value];
      });
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggle, type }}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

type AccordionItemProps = {
  value: string;
  className?: string;
  children: React.ReactNode;
};

export function AccordionItem({ value, className, children }: AccordionItemProps) {
  return (
    <div data-accordion-item={value} className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-soft", className)}>
      {children}
    </div>
  );
}

type AccordionTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

export function AccordionTrigger({ value, className, children, ...props }: AccordionTriggerProps) {
  const { openItems, toggle } = useAccordion();
  const open = openItems.includes(value);

  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => toggle(value)}
      className={cn(
        "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-primary transition-colors hover:bg-muted/60",
        className
      )}
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300", open && "rotate-180")} aria-hidden />
    </button>
  );
}

type AccordionContentProps = {
  value: string;
  className?: string;
  children: React.ReactNode;
};

export function AccordionContent({ value, className, children }: AccordionContentProps) {
  const { openItems } = useAccordion();
  const open = openItems.includes(value);

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: easePremium }}
          className="overflow-hidden"
        >
          <div className={cn("border-t border-border px-4 py-4 text-sm leading-relaxed text-muted-foreground", className)}>{children}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}