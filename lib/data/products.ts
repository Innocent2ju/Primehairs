import { db } from "@/lib/db";
import { products, productImages, categories } from "@/db/schema";

export interface StockDerivation {
  quantity: number;
  inStock: boolean;
  isLowStock: boolean;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  label: string;
  colorClass: string;
}

export interface StorefrontProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  description: string;
  material: string;
  category: string;
  image: string; // Primary image URL
  images: Array<{
    id: number;
    url: string;
    altText: string | null;
    isPrimary: boolean;
    displayOrder: number;
  }>;
  stock: number;
  inStock: boolean;
  derivedStock: StockDerivation;
}

export interface CategoryWithProducts {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  products: StorefrontProduct[];
}

/**
 * Derives user-facing stock status, badges, and labels from inventory quantity
 */
export function deriveStock(
  stock?: {
    quantity: number;
    lowStockThreshold: number;
    status?: string | null;
  } | null
): StockDerivation {
  const quantity = stock?.quantity ?? 0;
  const threshold = stock?.lowStockThreshold ?? 5;
  const inStock = quantity > 0;
  const isLowStock = inStock && quantity <= threshold;

  const status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = !inStock
    ? "OUT_OF_STOCK"
    : isLowStock
    ? "LOW_STOCK"
    : "IN_STOCK";

  const label = !inStock
    ? "Sold Out"
    : isLowStock
    ? `Only ${quantity} left`
    : "In Stock";

  const colorClass = !inStock
    ? "text-red-400"
    : isLowStock
    ? "text-amber-400"
    : "text-emerald-400";

  return { quantity, inStock, isLowStock, status, label, colorClass };
}

function formatProduct(
  p: typeof products.$inferSelect & {
    category: typeof categories.$inferSelect;
    images: Array<typeof productImages.$inferSelect>;
    stock: {
      quantity: number;
      lowStockThreshold: number;
      status?: string | null;
    } | null;
  }
): StorefrontProduct {
  const primaryImage =
    p.images.find((img) => img.isPrimary)?.url ??
    p.images[0]?.url ??
    "/file.svg";

  const derived = deriveStock(p.stock);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    description: p.description,
    material: p.material,
    category: p.category.name,
    image: primaryImage,
    images: p.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder,
    })),
    stock: derived.quantity,
    inStock: derived.inStock,
    derivedStock: derived,
  };
}

/**
 * Fetch latest products ordered by created_at DESC
 */
export async function getLatestProducts(limit = 8): Promise<StorefrontProduct[]> {
  const items = await db.query.products.findMany({
    orderBy: (prods, { desc }) => [desc(prods.createdAt)],
    limit,
    with: {
      category: true,
      images: {
        orderBy: (imgs, { asc }) => [asc(imgs.displayOrder)],
      },
      stock: true,
    },
  });

  return items.map(formatProduct);
}

/**
 * Fetch categories with their folded products, ordered by created_at DESC inside each category
 */
export async function getCategoriesWithFoldedProducts(): Promise<
  CategoryWithProducts[]
> {
  const categoryRecords = await db.query.categories.findMany({
    orderBy: (cats, { asc }) => [asc(cats.name)],
    with: {
      products: {
        orderBy: (prods, { desc }) => [desc(prods.createdAt)],
        with: {
          category: true,
          images: {
            orderBy: (imgs, { asc }) => [asc(imgs.displayOrder)],
          },
          stock: true,
        },
      },
    },
  });

  return categoryRecords
    .filter((cat) => cat.products.length > 0)
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      products: cat.products.map(formatProduct),
    }));
}

/**
 * Fetch a single product by unique slug, including its category, images, and stock
 */
export async function getProductBySlug(
  slug: string
): Promise<StorefrontProduct | null> {
  const item = await db.query.products.findFirst({
    where: (prods, { eq }) => eq(prods.slug, slug),
    with: {
      category: true,
      images: {
        orderBy: (imgs, { asc }) => [asc(imgs.displayOrder)],
      },
      stock: true,
    },
  });

  if (!item) return null;

  return formatProduct(item);
}

/**
 * Fetch all product slugs for static route generation (generateStaticParams)
 */
export async function getAllProductSlugs(): Promise<{ slug: string }[]> {
  const records = await db.query.products.findMany({
    columns: { slug: true },
  });

  return records.map((p) => ({ slug: p.slug }));
}
