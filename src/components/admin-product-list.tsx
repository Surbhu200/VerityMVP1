"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import type { MarketplaceProduct } from "@/lib/products";
import { formatCurrency } from "@/lib/utils";

export function AdminProductList({ products }: { products: MarketplaceProduct[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function deleteProduct(product: MarketplaceProduct) {
    const confirmed = window.confirm(`Delete "${product.name}" from the marketplace?`);
    if (!confirmed) return;

    setDeletingId(product.id);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: "DELETE"
      });
      const payload = (await response.json()) as { error?: string; source?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "Delete failed.");
        return;
      }

      setMessage(`Deleted ${product.name} from ${payload.source ?? "marketplace"} listings.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="glass-panel rounded-lg p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-coral">Listings</p>
          <h2 className="mt-2 text-2xl font-black">Manage products</h2>
        </div>
        <span className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm font-bold">
          {products.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {products.length ? (
          products.map((product) => (
            <div key={product.id} className="rounded-lg border border-ink/10 bg-paper/72 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-bold">{product.name}</p>
                  <p className="mt-1 text-sm text-ink/58">
                    {product.brand ?? "Unbranded"} · {product.category} · {formatCurrency(product.price, product.currency)}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase text-ink/40">{product.id}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={`/products/${product.id}`}
                    className="jitter-hover inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink/10 bg-porcelain text-ink"
                    aria-label={`Open ${product.name}`}
                    title="Open listing"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                  <button
                    type="button"
                    onClick={() => void deleteProduct(product)}
                    disabled={deletingId === product.id}
                    className="jitter-hover inline-flex h-10 w-10 items-center justify-center rounded-md bg-coral text-white disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`Delete ${product.name}`}
                    title="Delete listing"
                  >
                    {deletingId === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-ink/10 bg-paper/72 p-4 text-sm font-semibold text-ink/58">
            No marketplace listings yet.
          </div>
        )}
      </div>

      {message ? <p className="mt-4 rounded-md bg-mint/60 px-3 py-2 text-sm font-medium text-ink/70">{message}</p> : null}
    </div>
  );
}
