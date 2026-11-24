import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

import { products, type AttributePricingRule, type ProductAttribute } from "@/database";
import { db } from "@/lib/drizzleconnect";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TITLE_LENGTH = 200;
const MAX_TEXT_LENGTH = 5_000;
const MAX_LIST_ITEMS = 40;

const ATTRIBUTE_KEYS: readonly ProductAttribute[] = [
  "hairType",
  "hairVolume",
  "density",
  "colors",
  "hairLength",
  "laceType",
  "closureSizes",
];

const MONEY_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const badRequest = (message: string) =>
  NextResponse.json({ message }, { status: 400 });

const readString = (
  formData: FormData,
  key: string,
  label: string,
  { required = true, max = MAX_TEXT_LENGTH }: { required?: boolean; max?: number } = {},
): { value: string; error: string | null } => {
  const raw = formData.get(key);

  if (raw === null || typeof raw !== "string") {
    return {
      value: "",
      error: required ? `${label} is required.` : null,
    };
  }

  const value = raw.trim();

  if (required && !value) {
    return { value, error: `${label} is required.` };
  }

  if (value.length > max) {
    return { value, error: `${label} must be ${max} characters or fewer.` };
  }

  return { value, error: null };
};

const readList = (
  formData: FormData,
  key: string,
  label: string,
): { value: string[]; error: string | null } => {
  const raw = formData.get(key);

  if (raw === null || raw === "") return { value: [], error: null };

  if (typeof raw !== "string") {
    return { value: [], error: `${label} must be a JSON array of text values.` };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { value: [], error: `${label} must be valid JSON.` };
  }

  if (!Array.isArray(parsed)) {
    return { value: [], error: `${label} must be a JSON array.` };
  }

  const seen = new Set<string>();
  const values: string[] = [];

  for (const entry of parsed) {
    if (typeof entry !== "string") {
      return { value: [], error: `${label} must only contain text values.` };
    }

    const item = entry.trim();

    if (!item || seen.has(item.toLowerCase())) continue;

    seen.add(item.toLowerCase());
    values.push(item);

    if (values.length >= MAX_LIST_ITEMS) break;
  }

  return { value: values, error: null };
};

const isProductAttribute = (value: unknown): value is ProductAttribute =>
  typeof value === "string" &&
  ATTRIBUTE_KEYS.includes(value as ProductAttribute);

const readRules = (
  formData: FormData,
): { value: AttributePricingRule[]; error: string | null } => {
  const raw = formData.get("attributePricing");

  if (raw === null || raw === "") return { value: [], error: null };

  if (typeof raw !== "string") {
    return { value: [], error: "Attribute pricing must be valid JSON." };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { value: [], error: "Attribute pricing must be valid JSON." };
  }

  if (!Array.isArray(parsed)) {
    return { value: [], error: "Attribute pricing must be a JSON array." };
  }

  const rules: AttributePricingRule[] = [];

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") {
      return { value: [], error: "Each pricing rule needs an attribute, option and price." };
    }

    const rule = entry as Record<string, unknown>;

    if (!isProductAttribute(rule.attribute)) {
      return { value: [], error: `Unknown pricing attribute: "${String(rule.attribute)}".` };
    }

    const option = typeof rule.value === "string" ? rule.value.trim() : "";
    const price = typeof rule.price === "string" ? rule.price.trim() : String(rule.price ?? "");

    if (!option) {
      return { value: [], error: "Each pricing rule needs an option value." };
    }

    if (!MONEY_PATTERN.test(price) || Number(price) <= 0) {
      return {
        value: [],
        error: `The price for "${option}" must be greater than ₦0.`,
      };
    }

    rules.push({ attribute: rule.attribute, value: option, price });
  }

  return { value: rules, error: null };
};

export async function POST(req: NextRequest) {
  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    return badRequest(
      "Send the product as multipart form data (fields plus an image file).",
    );
  }

  const title = readString(formData, "title", "Product name", {
    max: MAX_TITLE_LENGTH,
  });
  if (title.error) return badRequest(title.error);

  if (title.value.length < 2) {
    return badRequest("Product name must be at least 2 characters.");
  }

  // The database derives the link from the title; make sure that link is usable
  // before the insert so the admin gets a clear message instead of a DB error.
  const slugPreview = title.value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slugPreview || !SLUG_PATTERN.test(slugPreview)) {
    return badRequest(
      "Product name must contain at least one letter or number so a product link can be created.",
    );
  }

  const description = readString(formData, "description", "Description");
  if (description.error) return badRequest(description.error);

  const overview = readString(formData, "overview", "Overview");
  if (overview.error) return badRequest(overview.error);

  const rawPrice = formData.get("basePrice");
  const priceText =
    typeof rawPrice === "string" ? rawPrice.replace(/[,₦\s]/g, "") : "";

  if (!priceText) {
    return badRequest("Base price is required.");
  }

  if (!MONEY_PATTERN.test(priceText) || Number(priceText) <= 0) {
    return badRequest("Base price must be a number greater than ₦0, e.g. 45000.00.");
  }

  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return badRequest("A product image is required.");
  }

  if (!file.type.startsWith("image/")) {
    return badRequest(`"${file.name}" is not an image. Upload a JPG, PNG, WEBP or AVIF file.`);
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return badRequest("The product image must be 10 MB or smaller.");
  }

  const variants = readList(formData, "variants", "Variant images");
  if (variants.error) return badRequest(variants.error);

  const hairType = readList(formData, "hairType", "Hair type");
  if (hairType.error) return badRequest(hairType.error);

  const hairVolume = readList(formData, "hairVolume", "Hair volume");
  if (hairVolume.error) return badRequest(hairVolume.error);

  const density = readList(formData, "density", "Density");
  if (density.error) return badRequest(density.error);

  const colors = readList(formData, "colors", "Colours");
  if (colors.error) return badRequest(colors.error);

  const hairLength = readList(formData, "hairLength", "Hair length");
  if (hairLength.error) return badRequest(hairLength.error);

  const laceType = readList(formData, "laceType", "Lace type");
  if (laceType.error) return badRequest(laceType.error);

  const closureSizes = readList(formData, "closureSizes", "Closure sizes");
  if (closureSizes.error) return badRequest(closureSizes.error);

  const tags = readList(formData, "tags", "Tags");
  if (tags.error) return badRequest(tags.error);

  const rules = readRules(formData);
  if (rules.error) return badRequest(rules.error);

  let imageUrl: string;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await new Promise<{ secure_url?: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { resource_type: "image", folder: "primehairs" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as { secure_url?: string });
            },
          )
          .end(buffer);
      },
    );

    if (!uploadResult.secure_url) {
      return NextResponse.json(
        { message: "The image could not be uploaded. Please try again." },
        { status: 502 },
      );
    }

    imageUrl = uploadResult.secure_url;
  } catch (error) {
    console.error("Product image upload failed:", error);
    return NextResponse.json(
      { message: "The image could not be uploaded. Please try again." },
      { status: 502 },
    );
  }

  try {
    const [createdProduct] = await db
      .insert(products)
      .values({
        title: title.value,
        description: description.value,
        overview: overview.value,
        image: imageUrl,
        variants: variants.value,
        hairType: hairType.value,
        hairVolume: hairVolume.value,
        density: density.value,
        colors: colors.value,
        hairLength: hairLength.value,
        laceType: laceType.value,
        closureSizes: closureSizes.value,
        tags: tags.value,
        basePrice: Number(priceText).toFixed(2),
        attributePricing: rules.value,
      })
      .returning();

    return NextResponse.json(
      { message: "Product created successfully", product: createdProduct },
      { status: 201 },
    );
  } catch (error) {
    // Log the driver detail for developers, show admins something actionable.
    console.error("Product creation failed:", error);
    return NextResponse.json(
      {
        message:
          "The product could not be saved. Check the details and try again. If it keeps failing, contact support.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const allProducts = await db.select().from(products);

    return NextResponse.json(
      { message: "Products fetched successfully", products: allProducts },
      { status: 200 },
    );
  } catch (error) {
    console.error("Product fetch failed:", error);
    return NextResponse.json(
      { message: "Products could not be loaded. Please try again." },
      { status: 500 },
    );
  }
}
