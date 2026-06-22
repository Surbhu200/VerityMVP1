import Link from "next/link";
import { Leaf } from "lucide-react";

const links = [
  { href: "/", label: "Marketplace" },
  { href: "/mission", label: "Mission" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/admin", label: "Admin" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5 font-semibold text-primary">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
            <Leaf className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden font-display tracking-tight sm:inline">Verity Research Market</span>
          <span className="font-display tracking-tight sm:hidden">Verity</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-0.5 sm:gap-1" aria-label="Primary navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-muted/80 hover:text-foreground sm:px-3"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
