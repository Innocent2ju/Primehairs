import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";

/** Product pages are statically generated, so refresh the ones whose stock changed. */
export function revalidateStorefrontStock(productSlugs: string[]): void {
  if (productSlugs.length === 0) return;

  revalidatePath(ROUTES.home);
  revalidatePath(ROUTES.products);
  for (const slug of new Set(productSlugs)) {
    revalidatePath(`${ROUTES.products}/${slug}`);
  }
}
