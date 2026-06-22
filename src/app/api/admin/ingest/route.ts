import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeAmazonUrl } from "@/lib/asin";
import { resolveAffiliateProductDraft, saveResolvedAffiliateProductToDatabase } from "@/lib/amazon";
import { authOptions, isAdminSession } from "@/lib/auth";
import { createLocalProductFromResolvedDraft } from "@/lib/local-products";
import { researchJobQueue } from "@/lib/research/jobs";

export const runtime = "nodejs";

const requestSchema = z.object({
  affiliateLink: z.string().trim().min(1).transform(normalizeAmazonUrl).pipe(z.string().url())
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid Amazon product URL." }, { status: 400 });
  }

  const affiliateLink = parsed.data.affiliateLink;
  let draft;

  try {
    draft = await resolveAffiliateProductDraft(affiliateLink);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enter a valid Amazon product URL." },
      { status: 400 }
    );
  }

  if (process.env.FORCE_LOCAL_PRODUCT_STORE === "true") {
    const product = await createLocalProductFromResolvedDraft(affiliateLink, draft);

    return NextResponse.json(
      {
        productId: product.id,
        productUrl: `/products/${product.id}`,
        jobId: `local-${Date.now()}`,
        status: "COMPLETED",
        message:
          "Local testing mode is enabled. Product page generated from the Amazon listing with local research curation when available."
      },
      { status: 202 }
    );
  }

  try {
    const product = await saveResolvedAffiliateProductToDatabase(affiliateLink, draft);
    const job = await researchJobQueue.enqueue(product.id);

    return NextResponse.json(
      {
        productId: product.id,
        jobId: job.id,
        status: job.status,
        message: "Processing started. Research curation will continue in the background."
      },
      { status: 202 }
    );
  } catch (error) {
    try {
      const product = await createLocalProductFromResolvedDraft(affiliateLink, draft);

      return NextResponse.json(
        {
          productId: product.id,
          productUrl: `/products/${product.id}`,
          jobId: `local-${Date.now()}`,
          status: "COMPLETED",
          message:
            "Local test product created from a regular Amazon listing. PostgreSQL was unavailable, so the product was saved to data/local-products.json with local research curation when available."
        },
        { status: 202 }
      );
    } catch (fallbackError) {
      return NextResponse.json(
        {
          error:
            fallbackError instanceof Error
              ? fallbackError.message
              : error instanceof Error
                ? error.message
                : "Affiliate ingestion failed."
        },
        { status: 500 }
      );
    }
  }
}
