import type { LucideIcon } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function IconFeatureCard({
  icon: Icon,
  title,
  description,
  className
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Card className={cn("h-full transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lift", className)}>
      <CardHeader className="space-y-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <CardTitle className="font-display text-lg font-semibold">{title}</CardTitle>
        <CardDescription className="leading-[1.75]">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
