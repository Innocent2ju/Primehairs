import type { ProductAttribute } from "@/database";

export type AdminAttributeKey = ProductAttribute;

export interface AdminAttributeField {
  key: AdminAttributeKey;
  label: string;
}

/** The selectable attributes, in the order the storefront presents them. */
export const ADMIN_ATTRIBUTE_FIELDS: ReadonlyArray<AdminAttributeField> = [
  { key: "hairType", label: "Hair Type" },
  { key: "hairVolume", label: "Hair Volume" },
  { key: "density", label: "Density" },
  { key: "colors", label: "Color" },
  { key: "hairLength", label: "Hair Length" },
  { key: "laceType", label: "Lace Type" },
  { key: "closureSizes", label: "Closure Size" },
];

/** Naira, as typed by an admin ("45,000" or "45000.50"). */
export const NAIRA_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

/** Numeric string with at most two decimal places, as stored in Postgres. */
export const MONEY_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

export const parseNaira = (raw: string): number | null => {
  const normalized = raw.replace(/[,₦\s]/g, "");
  if (!NAIRA_PATTERN.test(normalized)) return null;
  return Number(normalized);
};

export const toMoneyString = (value: number): string => value.toFixed(2);

export const slugify = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const formatNaira = (amount: number): string =>
  `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export interface ProductInput {
  title: string;
  description: string;
  overview: string;
  image: string;
  variants: string[];
  hairType: string[];
  hairVolume: string[];
  density: string[];
  colors: string[];
  hairLength: string[];
  laceType: string[];
  closureSizes: string[];
  tags: string[];
  basePrice: string;
  attributePricing: Array<{
    attribute: ProductAttribute;
    value: string;
    price: string;
  }>;
}

export type ProductActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };
