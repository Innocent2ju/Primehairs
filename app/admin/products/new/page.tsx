import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import ProductForm from "@/components/admin/forms/ProductForm";

export default function NewProductPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Link
        href="/admin/products"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-light-gray/60 transition-colors hover:text-gold"
      >
        <ArrowLeft className="size-3.5" />
        Back to products
      </Link>

      <ProductForm />
    </div>
  );
}
