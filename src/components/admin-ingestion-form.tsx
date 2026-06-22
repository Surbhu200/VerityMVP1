"use client";

import { useState } from "react";
import { Link2, Loader2, PlayCircle, Wand2 } from "lucide-react";

const sampleAmazonUrl = "https://www.amazon.com/dp/B09W8V6Q6F";

export function AdminIngestionForm() {
  const [affiliateLink, setAffiliateLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function ingestLink(link: string) {
    setLoading(true);
    setResult("Starting ingestion...");

    try {
      const response = await fetch("/api/admin/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ affiliateLink: link })
      });
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
        productId?: string;
        productUrl?: string;
        jobId?: string;
      };

      if (!response.ok) {
        setResult(payload.error ?? "Ingestion failed.");
        return;
      }

      setResult(`${payload.message} Product ${payload.productId}, job ${payload.jobId}.`);
      setAffiliateLink("");

      if (payload.productUrl) {
        window.setTimeout(() => {
          window.location.href = payload.productUrl ?? "/admin";
        }, 900);
      }
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Ingestion failed.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await ingestLink(affiliateLink);
  }

  return (
    <form onSubmit={onSubmit} className="glass-panel rounded-lg p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-mint text-coral">
          <Link2 className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-2xl font-bold">Amazon product ingestion</h2>
          <p className="mt-2 leading-7 text-ink/66">
            Paste any regular Amazon product listing. An affiliate tag is optional, so you can test the full flow before
            you have an affiliate account.
          </p>
        </div>
      </div>
      <label className="mt-6 grid gap-2 text-sm font-semibold">
        Amazon product URL
        <input
          value={affiliateLink}
          onChange={(event) => setAffiliateLink(event.target.value)}
          placeholder="amazon.com/dp/B0DEMO1234"
          className="rounded-md border border-ink/15 bg-paper px-3 py-3 text-ink outline-none ring-coral/30 transition focus:ring-4"
          required
          type="text"
        />
      </label>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setAffiliateLink(sampleAmazonUrl);
            void ingestLink(sampleAmazonUrl);
          }}
          disabled={loading}
          className="jitter-hover inline-flex items-center gap-2 rounded-md border border-ink/12 bg-porcelain px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Wand2 className="h-4 w-4 text-coral" aria-hidden />
          Try sample listing
        </button>
        <button
          type="submit"
          disabled={loading}
          className="jitter-hover inline-flex items-center gap-2 rounded-md bg-coral px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <PlayCircle className="h-4 w-4" aria-hidden />
          )}
          Start processing
        </button>
      </div>
      <p className="mt-4 text-sm leading-6 text-ink/54">
        If live product data is incomplete, Verity still creates a listing and marks missing price or evidence fields
        clearly until enrichment completes.
      </p>
      {result ? <p className="mt-4 rounded-md bg-mint/60 px-3 py-2 text-sm font-medium text-ink/70">{result}</p> : null}
    </form>
  );
}
