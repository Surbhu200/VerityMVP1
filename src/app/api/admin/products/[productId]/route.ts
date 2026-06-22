import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminSession } from "@/lib/auth";
import { deleteLocalProduct } from "@/lib/local-products";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  }

  const { productId } = await params;

  if (!productId) {
    return NextResponse.json({ error: "Product id is required." }, { status: 400 });
  }

  const deletedLocal = await deleteLocalProduct(productId);
  if (deletedLocal) {
    return NextResponse.json({ deleted: true, productId, source: "local" });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  try {
    await prisma.product.delete({ where: { id: productId } });
    return NextResponse.json({ deleted: true, productId, source: "database" });
  } catch {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
}
