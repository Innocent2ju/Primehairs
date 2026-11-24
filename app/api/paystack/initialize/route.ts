import { inArray, or } from "drizzle-orm";
import { NextResponse, after } from "next/server";

import { posthogLogsLogger, loggerProvider, SeverityNumber } from "@/instrumentation";

import {
  products,
  type OrderProductDetails,
  type Product,
  type ProductAttribute,
} from "@/database";
import { getDeliverySettings } from "@/lib/delivery-config";
import { deliveryFeeFor } from "@/lib/delivery-settings";
import { db } from "@/lib/drizzleconnect";
import {
  EMAIL_PATTERN,
  initializeTransaction,
  MAX_CART_ITEMS,
  MAX_QUANTITY,
  PaystackError,
  toKobo,
  type CheckoutMetadata,
  type CheckoutMetadataItem,
} from "@/lib/paystack";

const ATTRIBUTE_KEYS: readonly ProductAttribute[] = [
  "hairType",
  "hairVolume",
  "density",
  "colors",
  "hairLength",
  "laceType",
  "closureSizes",
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_PATTERN = /^[+()\d\s-]{7,20}$/;

type SelectedAttributes = Partial<Record<ProductAttribute, string>>;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const fail = (message: string, status = 400) =>
  NextResponse.json({ message }, { status });

const parseSelectedAttributes = (
  value: unknown,
): SelectedAttributes | null => {
  if (value === undefined || value === null) return {};

  const record = asRecord(value);

  if (!record) return null;

  const attributes: SelectedAttributes = {};

  for (const [key, raw] of Object.entries(record)) {
    if (!ATTRIBUTE_KEYS.includes(key as ProductAttribute)) return null;
    if (typeof raw !== "string") return null;

    const trimmed = raw.trim();

    if (trimmed.length === 0 || trimmed.length > 100) return null;

    attributes[key as ProductAttribute] = trimmed;
  }

  return attributes;
};

const buildDetails = (
  attributes: SelectedAttributes,
  lineTotalKobo: number,
): OrderProductDetails => ({
  hairType: attributes.hairType ?? "Standard",
  texture: attributes.hairVolume ?? "Standard",
  density: attributes.density ?? "Standard",
  color: attributes.colors ?? "Standard",
  length: attributes.hairLength ?? "Standard",
  price: (lineTotalKobo / 100).toFixed(2),
});

export async function POST(request: Request): Promise<NextResponse> {
  const body = asRecord(await request.json().catch(() => null));

  if (!body) return fail("A JSON body is required.");

  const customer = asRecord(body.customer);
  const delivery = asRecord(body.delivery);

  const customerName =
    customer && typeof customer.name === "string"
      ? customer.name.trim()
      : "";
  const email =
    customer && typeof customer.email === "string"
      ? customer.email.trim().toLowerCase()
      : "";
  const phone =
    customer && typeof customer.phone === "string"
      ? customer.phone.trim()
      : "";

  if (customerName.length < 2 || customerName.length > 120) {
    return fail("A valid full name is required.");
  }

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return fail("A valid email address is required.");
  }

  if (phone && !PHONE_PATTERN.test(phone)) {
    return fail("A valid phone number is required.");
  }

  const deliveryType = delivery?.deliveryType;

  if (deliveryType !== "doorstep" && deliveryType !== "branch") {
    return fail("Choose a valid delivery method.");
  }

  const address =
    typeof delivery?.address === "string" ? delivery.address.trim() : "";

  if (!address || address.length > 500) {
    return fail("A delivery address is required.");
  }

  const settings = await getDeliverySettings();

  if (deliveryType === "branch" && !settings.branchLocations.includes(address)) {
    return fail("Choose a valid pickup branch.");
  }

  if (
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    body.items.length > MAX_CART_ITEMS
  ) {
    return fail(`Your cart must contain between 1 and ${MAX_CART_ITEMS} items.`);
  }

  const requested: Array<{
    identifier: string;
    quantity: number;
    attributes: SelectedAttributes;
  }> = [];

  for (const rawItem of body.items) {
    const item = asRecord(rawItem);
    const identifier =
      item && typeof item.productId === "string" ? item.productId.trim() : "";
    const quantity = item?.quantity;

    if (!identifier) return fail("Every cart item needs a product id.");

    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      return fail(`Quantity must be a whole number between 1 and ${MAX_QUANTITY}.`);
    }

    const attributes = parseSelectedAttributes(item?.selectedAttributes);

    if (!attributes) return fail("A cart item has invalid options.");

    requested.push({ identifier, quantity, attributes });
  }

  const identifiers = [...new Set(requested.map((item) => item.identifier))];
  const uuidIdentifiers = identifiers.filter((identifier) =>
    UUID_PATTERN.test(identifier),
  );

  // Cart lines normally carry the slug; accepting the id too keeps the API
  // usable for callers that hold the product row.
  const rows: Product[] = await db
    .select()
    .from(products)
    .where(
      uuidIdentifiers.length > 0
        ? or(
            inArray(products.slug, identifiers),
            inArray(products.id, uuidIdentifiers),
          )
        : inArray(products.slug, identifiers),
    );

  const byIdentifier = new Map<string, Product>();

  for (const product of rows) {
    byIdentifier.set(product.slug, product);
    byIdentifier.set(product.id, product);
  }

  const metadataItems: CheckoutMetadataItem[] = [];
  let itemsSubtotalKobo = 0;

  for (const item of requested) {
    const product = byIdentifier.get(item.identifier);

    if (!product) {
      return fail(`Product "${item.identifier}" is no longer available.`);
    }

    for (const [key, value] of Object.entries(item.attributes)) {
      const attribute = key as ProductAttribute;

      if (!product[attribute].includes(value)) {
        return fail(`Invalid ${attribute} option for ${product.title}.`);
      }
    }

    const basePriceKobo = toKobo(product.basePrice);
    const optionsKobo = product.attributePricing.reduce(
      (total, rule) =>
        item.attributes[rule.attribute] === rule.value
          ? total + toKobo(rule.price)
          : total,
      0,
    );
    const unitPriceKobo = basePriceKobo + optionsKobo;
    const lineTotalKobo = unitPriceKobo * item.quantity;

    if (lineTotalKobo <= 0) {
      return fail(`${product.title} does not have a valid price.`);
    }

    itemsSubtotalKobo += lineTotalKobo;

    metadataItems.push({
      productId: product.id,
      name: product.title,
      quantity: item.quantity,
      unitPriceKobo,
      attributes: item.attributes,
      details: buildDetails(item.attributes, lineTotalKobo),
    });
  }

  const deliveryFeeNaira = deliveryFeeFor(settings, deliveryType);
  const deliveryFeeKobo = Math.round(deliveryFeeNaira * 100);
  const totalNaira = itemsSubtotalKobo / 100 + deliveryFeeNaira;
  const amountKobo = Math.round(totalNaira * 100);

  if (amountKobo <= 0) {
    return fail("The order total must be greater than zero.");
  }

  const metadata: CheckoutMetadata = {
    version: 2,
    expectedAmountKobo: amountKobo,
    itemsSubtotalKobo,
    deliveryFeeKobo,
    customer: {
      email,
      name: customerName,
      phone: phone || undefined,
      deliveryType,
      address,
    },
    items: metadataItems,
  };

  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin
  ).replace(/\/+$/, "");

  try {
    const { authorization_url, reference } = await initializeTransaction({
      email,
      amountKobo,
      callbackUrl: `${baseUrl}/checkout/callback`,
      metadata,
    });

    posthogLogsLogger?.emit({
      body: "Payment authorization initialized",
      severityNumber: SeverityNumber.INFO,
      attributes: {
        payment_provider: "paystack",
        amount_kobo: amountKobo,
        item_count: requested.length,
        delivery_type: deliveryType,
      },
    });

    after(async () => {
      await loggerProvider?.forceFlush().catch(() => undefined);
    });

    return NextResponse.json({
      authorization_url,
      reference,
      amountKobo,
      deliveryFeeKobo,
      itemsSubtotalKobo,
    });
  } catch (error) {
    if (error instanceof PaystackError) {
      return fail(error.message, error.status);
    }

    console.error("Paystack initialize error:", error);

    return fail("Could not start the payment. Please try again.", 502);
  }
}
