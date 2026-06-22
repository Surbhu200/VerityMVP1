"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { easePremium } from "@/lib/motion";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within Tabs");
  return ctx;
}

type TabsProps = {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
};

export function Tabs({ defaultValue, className, children }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div role="tablist" className={cn("inline-flex flex-wrap gap-1 rounded-lg border border-border bg-muted/50 p-1", className)}>
      {children}
    </div>
  );
}

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string };

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const { value: active, setValue } = useTabs();
  const selected = active === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => setValue(value)}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-semibold transition-all duration-300",
        selected ? "bg-card text-primary shadow-soft" : "text-muted-foreground hover:text-primary",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type TabsContentProps = { value: string; className?: string; children: React.ReactNode };

export function TabsContent({ value, className, children }: TabsContentProps) {
  const { value: active } = useTabs();
  const selected = active === value;

  return (
    <AnimatePresence mode="wait">
      {selected ? (
        <motion.div
          key={value}
          role="tabpanel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: easePremium }}
          className={cn(className)}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}