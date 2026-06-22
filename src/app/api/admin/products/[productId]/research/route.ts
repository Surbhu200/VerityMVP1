import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminSession } from "@/lib/auth";
import { researchJobQueue } from "@/lib/research/jobs";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  }

  const { productId } = await params;
  const job = await researchJobQueue.enqueue(productId);

  return NextResponse.json(
    {
      productId,
      jobId: job.id,
      status: job.status,
      message: "Research processing started."
    },
    { status: 202 }
  );
}
