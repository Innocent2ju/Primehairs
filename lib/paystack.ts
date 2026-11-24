import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import {
  checkouts,
  orders,
  type Checkout,
  type NewOrder,
  type OrderProductDetails,
  type ProductAttribute,
} from "@/database";
import { getDeliverySettings } from "@/lib/delivery-config";
import {
  deliveryFeeFor,
  type DeliveryType,
  type DeliverySettings,
} from "@/lib/delivery-settings";
import { db } from "@/lib/drizzleconnect";

const PAYSTACK_API_URL = "https://api.paystack.co";

export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const MAX_CART_ITEMS = 50;
export const MAX_QUANTITY = 99;

const REFERENCE_PATTERN = /^[A-Za-z0-9_-]{6,120}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DETAIL_KEYS = [
  "hairType",
  "texture",
  "density",
  "color",
  "length",
  "price",
] as const;
const ATTRIBUTE_KEYS: readonly ProductAttribute[] = [
  "hairType",
  "hairVolume",
  "density",
  "colors",
  "hairLength",
  "laceType",
  "closureSizes",
];

export class PaystackError extends Error {
  constructor(
    message: string,
    readonly status: number = 502,
  ) {
    super(message);
    this.name = "PaystackError";
  }
}

// Raised when Paystack succeeds but the payment does not match the order we
// stored at initialization. Retrying cannot fix it, so callers must not retry.
export class PaymentVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentVerificationError";
  }
}

export interface CheckoutMetadataItem {
  productId: string;
  name: string;
  quantity: number;
  unitPriceKobo: number;
  attributes: Partial<Record<ProductAttribute, string>>;
  details: OrderProductDetails;
}

export interface CheckoutMetadata {
  version: 2;
  expectedAmountKobo: number;
  itemsSubtotalKobo: number;
  deliveryFeeKobo: number;
  customer: {
    email: string;
    name: string;
    phone?: string;
    deliveryType: DeliveryType;
    address: string;
  };
  items: CheckoutMetadataItem[];
}

export interface PaystackTransaction {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  metadata: unknown;
}

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data?: T;
}

interface InitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export const toKobo = (amount: string | number): number => {
  const parsed = typeof amount === "number" ? amount : Number(amount);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
};

export const isReference = (value: string): boolean =>
  REFERENCE_PATTERN.test(value);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const isKoboAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const isKobo = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const parseAttributes = (
  value: unknown,
): Partial<Record<ProductAttribute, string>> | null => {
  if (value === undefined) return {};

  const record = asRecord(value);

  if (!record) return null;

  const attributes: Partial<Record<ProductAttribute, string>> = {};

  for (const [key, raw] of Object.entries(record)) {
    if (!ATTRIBUTE_KEYS.includes(key as ProductAttribute)) return null;
    if (typeof raw !== "string" || raw.length === 0 || raw.length > 100) {
      return null;
    }

    attributes[key as ProductAttribute] = raw;
  }

  return attributes;
};

async function paystackRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new PaystackError("PAYSTACK_SECRET_KEY is not configured.", 500);
  }

  const response = await fetch(`${PAYSTACK_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  let payload: PaystackResponse<T> | null = null;

  try {
    payload = (await response.json()) as PaystackResponse<T>;
  } catch {
    // A non-JSON body carries no usable detail; the status code is the signal.
  }

  if (!response.ok || !payload?.status || !payload.data) {
    throw new PaystackError(
      payload?.message ?? `Paystack request failed (${response.status}).`,
      response.status >= 400 && response.status < 500 ? 400 : 502,
    );
  }

  return payload.data;
}

export async function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  callbackUrl: string;
  metadata: CheckoutMetadata;
}): Promise<{ authorization_url: string; reference: string }> {
  const data = await paystackRequest<InitializeData>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: "NGN",
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });

  return {
    authorization_url: data.authorization_url,
    reference: data.reference,
  };
}

export async function verifyTransaction(
  reference: string,
): Promise<PaystackTransaction> {
  return paystackRequest<PaystackTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}

export function parseCheckoutMetadata(
  raw: unknown,
  settings: DeliverySettings,
): CheckoutMetadata | null {
  let value = raw;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  const record = asRecord(value);

  if (!record || record.version !== 2) return null;

  const customer = asRecord(record.customer);

  if (!customer) return null;

  const email =
    typeof customer.email === "string"
      ? customer.email.trim().toLowerCase()
      : "";
  const name =
    typeof customer.name === "string" ? customer.name.trim() : "";
  const phone =
    typeof customer.phone === "string" ? customer.phone.trim() : undefined;
  const address =
    typeof customer.address === "string" ? customer.address.trim() : "";
  const deliveryType = customer.deliveryType;

  if (!EMAIL_PATTERN.test(email) || !name || !address) return null;
  if (deliveryType !== "doorstep" && deliveryType !== "branch") return null;
  if (phone !== undefined && (phone.length === 0 || phone.length > 30)) {
    return null;
  }

  if (
    !Array.isArray(record.items) ||
    record.items.length === 0 ||
    record.items.length > MAX_CART_ITEMS
  ) {
    return null;
  }

  const items: CheckoutMetadataItem[] = [];
  let itemsSubtotalKobo = 0;

  for (const rawItem of record.items) {
    const item = asRecord(rawItem);
    const details = item ? asRecord(item.details) : null;

    if (!item || !details) return null;
    if (typeof item.productId !== "string" || !UUID_PATTERN.test(item.productId)) {
      return null;
    }
    if (
      typeof item.name !== "string" ||
      item.name.trim().length === 0 ||
      item.name.length > 200
    ) {
      return null;
    }
    if (!isKoboAmount(item.unitPriceKobo)) return null;
    if (
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_QUANTITY
    ) {
      return null;
    }

    const attributes = parseAttributes(item.attributes);

    if (!attributes) return null;

    const parsedDetails = {} as OrderProductDetails;

    for (const key of DETAIL_KEYS) {
      const entry = details[key];

      if (typeof entry !== "string" || entry.length === 0) return null;

      parsedDetails[key] = entry;
    }

    items.push({
      productId: item.productId,
      name: item.name.trim(),
      quantity: item.quantity,
      unitPriceKobo: item.unitPriceKobo,
      attributes,
      details: parsedDetails,
    });

    itemsSubtotalKobo += item.unitPriceKobo * item.quantity;
  }

  const deliveryFeeKobo = record.deliveryFeeKobo;

  if (!isKobo(deliveryFeeKobo)) return null;

  // The fee must still match the admin-configured delivery settings, so stale
  // or edited metadata cannot be used to pay less than the configured fee.
  if (
    deliveryFeeKobo !==
    Math.round(deliveryFeeFor(settings, deliveryType) * 100)
  ) {
    return null;
  }

  if (record.itemsSubtotalKobo !== itemsSubtotalKobo) return null;

  // The stored total must agree with items + delivery, or metadata was tampered with.
  if (record.expectedAmountKobo !== itemsSubtotalKobo + deliveryFeeKobo) {
    return null;
  }

  return {
    version: 2,
    expectedAmountKobo: itemsSubtotalKobo + deliveryFeeKobo,
    itemsSubtotalKobo,
    deliveryFeeKobo,
    customer: { email, name, phone, deliveryType, address },
    items,
  };
}

const createOrderNumber = (): string =>
  `PH-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;

export interface FinalizeResult {
  checkout: Checkout;
  metadata: CheckoutMetadata;
  alreadyProcessed: boolean;
}

/**
 * Persists a confirmed Paystack payment exactly once per reference.
 *
 * The checkout row's unique payment_reference is the idempotency key: whichever
 * request (callback verify or webhook) inserts it wins and writes the orders;
 * every later request for the same reference finds it and does nothing.
 */
export async function finalizeTransaction(
  transaction: PaystackTransaction,
): Promise<FinalizeResult> {
  if (transaction.status !== "success") {
    throw new PaymentVerificationError("Payment has not been completed.");
  }

  if (transaction.currency !== "NGN") {
    throw new PaymentVerificationError("Unsupported payment currency.");
  }

  const settings = await getDeliverySettings();
  const metadata = parseCheckoutMetadata(transaction.metadata, settings);

  if (!metadata) {
    throw new PaymentVerificationError(
      "The payment is missing its order details.",
    );
  }

  if (transaction.amount !== metadata.expectedAmountKobo) {
    throw new PaymentVerificationError(
      "The amount paid does not match the order total.",
    );
  }

  const [existing] = await db
    .select()
    .from(checkouts)
    .where(eq(checkouts.paymentReference, transaction.reference))
    .limit(1);

  if (existing) {
    return { checkout: existing, metadata, alreadyProcessed: true };
  }

  const [claimed] = await db
    .insert(checkouts)
    .values({
      orderNumber: createOrderNumber(),
      customerEmail: metadata.customer.email,
      customerName: metadata.customer.name,
      paymentReference: transaction.reference,
      paymentStatus: "paid",
      orderStatus: "processed",
      deliveryType: metadata.customer.deliveryType,
      address: metadata.customer.address,
    })
    .onConflictDoNothing({ target: checkouts.paymentReference })
    .returning();

  if (!claimed) {
    // Another request claimed the reference between our SELECT and INSERT.
    const [raced] = await db
      .select()
      .from(checkouts)
      .where(eq(checkouts.paymentReference, transaction.reference))
      .limit(1);

    if (!raced) {
      throw new Error("Could not load the checkout for this payment.");
    }

    return { checkout: raced, metadata, alreadyProcessed: true };
  }

  const orderRows: NewOrder[] = metadata.items.map((item) => ({
    productId: item.productId,
    productDetails: item.details,
    email: metadata.customer.email,
  }));

  try {
    await db.insert(orders).values(orderRows);
  } catch (error) {
    // Without the order rows the checkout is a half-written record; release the
    // claim so a later verification can retry the insert.
    await db.delete(checkouts).where(eq(checkouts.id, claimed.id));
    throw error;
  }

  return { checkout: claimed, metadata, alreadyProcessed: false };
}
