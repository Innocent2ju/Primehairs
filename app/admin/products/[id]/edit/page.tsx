import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import ProductForm from "@/components/admin/forms/ProductForm";
import { getProductById } from "@/lib/admin/queries";

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Link
        href="/admin/products"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-light-gray/60 transition-colors hover:text-gold"
      >
        <ArrowLeft className="size-3.5" />
        Back to products
      </Link>

      <ProductForm product={product} />
    </div>
  );
}
