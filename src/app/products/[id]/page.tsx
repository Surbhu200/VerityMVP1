import { ProductExperience } from "@/components/product-experience";
import { getProduct } from "@/lib/products";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  return <ProductExperience product={product} />;
}
