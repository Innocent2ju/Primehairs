"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  products,
  type AttributePricingRule,
  type NewProduct,
  type Product,
  type ProductAttribute,
} from "@/database";
import {
  requireAdmin,
  NotAdminError,
} from "@/lib/admin/auth";
import {
  CloudinaryUploadError,
  uploadProductImage,
} from "@/lib/admin/cloudinary";
import {
  parseNaira,
  toMoneyString,
  type ProductActionState,
  type ProductInput,
} from "@/lib/admin/types";
import { db } from "@/lib/drizzleconnect";

const ATTRIBUTE_KEYS: readonly ProductAttribute[] = [
  "hairType",
  "hairVolume",
  "density",
  "colors",
  "hairLength",
  "laceType",
  "closureSizes",
];

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 5_000;
const MAX_LIST_ITEM = 100;
const MAX_LIST_LENGTH = 40;
const MAX_RULES = 200;
const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONEY_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

const revalidateStorefront = (): void => {
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
};

const errorState = (message: string): ProductActionState => ({
  status: "error",
  message,
});

const guardFailure = (error: unknown): ProductActionState | null => {
  if (error instanceof NotAdminError) {
    return errorState("You are not authorized to manage products.");
  }
  return null;
};

const isProductAttribute = (value: unknown): value is ProductAttribute =>
  typeof value === "string" && ATTRIBUTE_KEYS.includes(value as ProductAttribute);

const cleanString = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const cleanList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const item = entry.trim();
    if (!item || item.length > MAX_LIST_ITEM) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= MAX_LIST_LENGTH) break;
  }

  return result;
};

const cleanImageUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const candidate = value.trim();

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};

const normalizeMoney = (value: unknown): string | null => {
  const numeric =
    typeof value === "number"
      ? Number.isFinite(value)
        ? value
        : null
      : typeof value === "string"
        ? parseNaira(value)
        : null;

  if (numeric === null || numeric <= 0) return null;

  const money = toMoneyString(numeric);
  return MONEY_PATTERN.test(money) ? money : null;
};

const cleanRules = (
  value: unknown,
  attributes: Record<ProductAttribute, string[]>,
): { rules: AttributePricingRule[]; error: string | null } => {
  if (value === undefined || value === null) return { rules: [], error: null };
  if (!Array.isArray(value)) {
    return { rules: [], error: "Attribute pricing must be a list of rules." };
  }
  if (value.length > MAX_RULES) {
    return { rules: [], error: `Use at most ${MAX_RULES} pricing rules.` };
  }

  const rules: AttributePricingRule[] = [];

  for (const rawRule of value) {
    const rule = rawRule as Partial<AttributePricingRule> | null;

    if (!rule || !isProductAttribute(rule.attribute)) {
      return { rules: [], error: "Every pricing rule needs a valid attribute." };
    }

    const option = typeof rule.value === "string" ? rule.value.trim() : "";

    if (!option) {
      return { rules: [], error: "Every pricing rule needs an option value." };
    }

    if (!attributes[rule.attribute].includes(option)) {
      return {
        rules: [],
        error: `"${option}" is not one of the "${rule.attribute}" options.`,
      };
    }

    const price = normalizeMoney(rule.price);

    if (price === null) {
      return {
        rules: [],
        error: `The price for "${option}" must be greater than ₦0.`,
      };
    }

    rules.push({ attribute: rule.attribute, value: option, price });
  }

  return { rules, error: null };
};

interface ValidatedProduct {
  values: Omit<NewProduct, "slug">;
}

type ValidationFailure = {
  ok: false;
  message: string;
  fieldErrors: Record<string, string>;
};

const failure = (field: string | null, message: string): ValidationFailure => ({
  ok: false,
  message,
  fieldErrors: field ? { [field]: message } : {},
});

const validate = (
  input: ProductInput,
): { ok: true; data: ValidatedProduct } | ValidationFailure => {
  const title = cleanString(input.title, MAX_TITLE);
  const description = cleanString(input.description, MAX_DESCRIPTION);
  const overview = cleanString(input.overview, MAX_DESCRIPTION);

  if (title.length < 2) {
    return failure(
      "title",
      "Give the product a name of at least 2 characters.",
    );
  }

  if (!description) {
    return failure("description", "A description is required.");
  }

  if (!overview) {
    return failure("overview", "An overview is required.");
  }

  const image = cleanImageUrl(input.image);

  if (!image) {
    return failure("image", "Upload a main product image first.");
  }

  const variants = [
    image,
    ...(Array.isArray(input.variants) ? input.variants : [])
      .map(cleanImageUrl)
      .filter((url): url is string => Boolean(url)),
  ]
    .filter((url, index, all) => all.indexOf(url) === index)
    .slice(0, MAX_IMAGES);

  const basePrice = normalizeMoney(input.basePrice);

  if (basePrice === null) {
    return failure("basePrice", "The base price must be greater than ₦0.");
  }

  const attributes: Record<ProductAttribute, string[]> = {
    hairType: cleanList(input.hairType),
    hairVolume: cleanList(input.hairVolume),
    density: cleanList(input.density),
    colors: cleanList(input.colors),
    hairLength: cleanList(input.hairLength),
    laceType: cleanList(input.laceType),
    closureSizes: cleanList(input.closureSizes),
  };

  const { rules, error } = cleanRules(input.attributePricing, attributes);

  if (error) return failure(null, error);

  return {
    ok: true,
    data: {
      values: {
        title,
        description,
        overview,
        image,
        variants,
        ...attributes,
        tags: cleanList(input.tags),
        basePrice,
        attributePricing: rules,
      },
    },
  };
};

export async function createProduct(
  input: ProductInput,
): Promise<ProductActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    const guarded = guardFailure(error);
    if (guarded) return guarded;
    throw error;
  }

  const validated = validate(input);

  if (!validated.ok) {
    return {
      status: "error",
      message: validated.message,
      fieldErrors: validated.fieldErrors,
    };
  }

  try {
    await db.insert(products).values(validated.data.values);
  } catch (error) {
    console.error("createProduct failed:", error);
    return errorState("Could not save the product. Please try again.");
  }

  revalidateStorefront();
  redirect("/admin/products?created=1");
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ProductActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    const guarded = guardFailure(error);
    if (guarded) return guarded;
    throw error;
  }

  if (!UUID_PATTERN.test(id)) return errorState("Invalid product id.");

  const validated = validate(input);

  if (!validated.ok) {
    return {
      status: "error",
      message: validated.message,
      fieldErrors: validated.fieldErrors,
    };
  }

  try {
    const [updated] = await db
      .update(products)
      .set(validated.data.values)
      .where(eq(products.id, id))
      .returning({ id: products.id });

    if (!updated) {
      return errorState(
        "This product no longer exists. Refresh the page and try again.",
      );
    }
  } catch (error) {
    console.error("updateProduct failed:", error);
    return errorState("Could not update the product. Please try again.");
  }

  revalidateStorefront();
  redirect("/admin/products?updated=1");
}

export async function deleteProduct(id: string): Promise<ProductActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    const guarded = guardFailure(error);
    if (guarded) return guarded;
    throw error;
  }

  if (!UUID_PATTERN.test(id)) return errorState("Invalid product id.");

  try {
    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });

    if (!deleted) {
      return errorState(
        "This product no longer exists. Refresh the page and try again.",
      );
    }
  } catch (error) {
    console.error("deleteProduct failed:", error);
    return errorState(
      "Could not delete the product. It may be referenced by existing orders.",
    );
  }

  revalidateStorefront();
  return { status: "success", message: "Product deleted." };
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  await requireAdmin();
  return findProduct(id);
}

const findProduct = async (id: string): Promise<Product | null> => {
  if (!UUID_PATTERN.test(id)) return null;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return product ?? null;
};

/**
 * Uploads one image (or many) to Cloudinary from the admin form. Files arrive
 * as raw `File` parts of FormData; the result URLs are returned in order.
 */
export async function uploadImages(
  formData: FormData,
): Promise<{ status: "success"; urls: string[] } | { status: "error"; message: string }> {
  try {
    await requireAdmin();
  } catch (error) {
    const guarded = guardFailure(error);
    if (guarded) {
      return {
        status: "error",
        message: guarded.status === "error" ? guarded.message : "Unauthorized.",
      };
    }
    throw error;
  }

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return { status: "error", message: "Select at least one image." };
  }

  if (files.length > MAX_IMAGES) {
    return { status: "error", message: `Upload at most ${MAX_IMAGES} images at once.` };
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return { status: "error", message: `${file.name} is not an image.` };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { status: "error", message: `${file.name} is larger than 10 MB.` };
    }
  }

  try {
    const results = await Promise.all(files.map(uploadProductImage));
    return { status: "success", urls: results.map((result) => result.url) };
  } catch (error) {
    if (error instanceof CloudinaryUploadError) {
      return { status: "error", message: error.message };
    }
    console.error("uploadImages failed:", error);
    return { status: "error", message: "Image upload failed. Please try again." };
  }
}

