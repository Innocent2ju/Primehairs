"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";

import type { ProductAttribute } from "@/database";
import { useCart } from "@/context/cart-context";
import { authClient } from "@/lib/auth-client";
import {
  deliveryFeeFor,
  type DeliverySettings,
  type DeliveryType,
} from "@/lib/delivery-settings";
import { cn } from "@/lib/utils";

const ATTRIBUTE_LABELS: Record<ProductAttribute, string> = {
  hairType: "Hair Type",
  hairVolume: "Hair Volume",
  density: "Density",
  colors: "Color",
  hairLength: "Length",
  laceType: "Lace Type",
  closureSizes: "Closure Size",
};

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_PATTERN = /^[+()\d\s-]{7,20}$/;

const inputClassName =
  "w-full rounded-lg border border-white/15 bg-neutral-900/70 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/20";

const formatNaira = (value: number): string =>
  `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatAttributes = (
  attributes: Partial<Record<ProductAttribute, string>>,
): string =>
  Object.entries(attributes)
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .map(
      ([key, value]) =>
        `${ATTRIBUTE_LABELS[key as ProductAttribute] ?? key}: ${value}`,
    )
    .join(" • ");

interface InitializeResponse {
  authorization_url?: string;
  message?: string;
}

interface CheckoutFormProps {
  settings: DeliverySettings;
}

const CheckoutForm = ({ settings }: CheckoutFormProps) => {
  const { items, subtotal, totalItems } = useCart();
  const { data: session } = authClient.useSession();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("branch");
  const [branch, setBranch] = useState<string>(
    settings.branchLocations[0] ?? "",
  );
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    const name = session.user.name ?? "";
    const userEmail = session.user.email ?? "";

    if (name) setFullName((current) => current || name);
    if (userEmail) setEmail((current) => current || userEmail);
  }, [session]);

  const deliveryFee = deliveryFeeFor(settings, deliveryType);
  const total = subtotal + deliveryFee;

  const address = useMemo(() => {
    if (deliveryType === "branch") return branch;

    return [street.trim(), city.trim(), stateName.trim()]
      .filter(Boolean)
      .join(", ");
  }, [branch, city, deliveryType, stateName, street]);

  const handlePay = async () => {
    if (isSubmitting || items.length === 0) return;

    setError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      setError("Enter your full name.");
      return;
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!PHONE_PATTERN.test(trimmedPhone)) {
      setError("Enter a valid phone number.");
      return;
    }

    if (deliveryType === "branch" && !settings.branchLocations.includes(branch)) {
      setError("Choose a pickup branch.");
      return;
    }

    if (
      deliveryType === "doorstep" &&
      (!street.trim() || !city.trim() || !stateName.trim())
    ) {
      setError("Enter your street address, city and state.");
      return;
    }

    setIsSubmitting(true);
    setAuthorizationUrl(null);

    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedAttributes: item.selectedAttributes,
          })),
          customer: {
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
          },
          delivery: { deliveryType, address },
        }),
      });
      const payload = (await response
        .json()
        .catch(() => null)) as InitializeResponse | null;

      if (!response.ok || !payload?.authorization_url) {
        setError(
          payload?.message ?? "Could not start the payment. Please try again.",
        );
        return;
      }

      setAuthorizationUrl(payload.authorization_url);
      window.open(payload.authorization_url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Could not start the payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-16 text-white">
        <section className="w-full max-w-md rounded-2xl border border-gold/25 bg-[#1A1A1A]/95 p-8 text-center shadow-2xl">
          <ShoppingBag className="mx-auto size-10 text-gold" aria-hidden="true" />
          <h1 className="mt-4 font-playfair text-2xl font-bold">
            Your bag is empty
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Add a piece from the collection before checking out.
          </p>
          <Link
            href="/products"
            className="mt-6 flex w-full items-center justify-center rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-300"
          >
            Continue shopping
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 text-white md:px-12 lg:px-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Secure Checkout
          </span>
          <h1 className="font-playfair text-3xl font-bold md:text-4xl">
            Review your order
          </h1>
          <p className="text-sm text-gray-400">
            {totalItems} {totalItems === 1 ? "item" : "items"} ready for delivery.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div className="flex flex-col gap-6">
            <section className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                Order Summary
              </h2>

              <ul className="mt-4 flex flex-col divide-y divide-white/10">
                {items.map((item) => (
                  <li
                    key={item.lineKey}
                    className="flex gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="size-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="text-sm font-semibold leading-snug text-white">
                        {item.name}
                      </p>
                      {formatAttributes(item.selectedAttributes) ? (
                        <p className="text-[11px] leading-relaxed text-gray-400">
                          {formatAttributes(item.selectedAttributes)}
                        </p>
                      ) : null}
                      <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs">
                        <span className="text-gray-400">
                          {item.quantity} × {formatNaira(item.unitPrice)}
                        </span>
                        <span className="font-semibold text-gold">
                          {formatNaira(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                Contact Details
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label
                    htmlFor="fullName"
                    className="text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Ada Obi"
                    autoComplete="name"
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="phone"
                    className="text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+234 801 234 5678"
                    autoComplete="tel"
                    className={inputClassName}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                Delivery Method
              </h2>

              <div
                className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
                role="radiogroup"
                aria-label="Delivery method"
              >
                <button
                  type="button"
                  role="radio"
                  onClick={() => setDeliveryType("branch")}
                  aria-checked={deliveryType === "branch"}
                  className={cn(
                    "cursor-pointer rounded-xl border p-4 text-left transition-colors",
                    deliveryType === "branch"
                      ? "border-gold bg-gold/10"
                      : "border-white/15 hover:border-white/30",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Store className="size-4 text-gold" aria-hidden="true" />
                      Branch Pickup
                    </span>
                    <span className="text-xs font-bold text-gold">
                      {formatNaira(deliveryFeeFor(settings, "branch"))}
                    </span>
                  </span>
                  <span className="mt-1 block text-[11px] text-gray-400">
                    Collect your order at a Prime Hairs branch.
                  </span>
                </button>

                <button
                  type="button"
                  role="radio"
                  onClick={() => setDeliveryType("doorstep")}
                  aria-checked={deliveryType === "doorstep"}
                  className={cn(
                    "cursor-pointer rounded-xl border p-4 text-left transition-colors",
                    deliveryType === "doorstep"
                      ? "border-gold bg-gold/10"
                      : "border-white/15 hover:border-white/30",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Truck className="size-4 text-gold" aria-hidden="true" />
                      Doorstep Delivery
                    </span>
                    <span className="text-xs font-bold text-gold">
                      {settings.doorstepFeeNgn === 0
                        ? "Free"
                        : `+${formatNaira(deliveryFeeFor(settings, "doorstep"))}`}
                    </span>
                  </span>
                  <span className="mt-1 block text-[11px] text-gray-400">
                    Delivered to your street address.
                  </span>
                </button>
              </div>

              <div className="mt-4">
                {deliveryType === "branch" ? (
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="branch"
                      className="text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                      Pickup Branch
                    </label>
                    <select
                      id="branch"
                      value={branch}
                      onChange={(event) => setBranch(event.target.value)}
                      className={cn(inputClassName, "cursor-pointer")}
                    >
                      {settings.branchLocations.map((location) => (
                        <option
                          key={location}
                          value={location}
                          className="bg-neutral-900 text-white"
                        >
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label
                        htmlFor="street"
                        className="text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                      >
                        Street Address
                      </label>
                      <input
                        id="street"
                        type="text"
                        value={street}
                        onChange={(event) => setStreet(event.target.value)}
                        placeholder="12 Adeniyi Jones Avenue"
                        autoComplete="address-line1"
                        className={inputClassName}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="city"
                        className="text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                      >
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        placeholder="Ikeja"
                        autoComplete="address-level2"
                        className={inputClassName}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="state"
                        className="text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                      >
                        State
                      </label>
                      <input
                        id="state"
                        type="text"
                        value={stateName}
                        onChange={(event) => setStateName(event.target.value)}
                        placeholder="Lagos"
                        autoComplete="address-level1"
                        className={inputClassName}
                      />
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-3 text-[11px] text-gray-500">
                Doorstep fee is {formatNaira(settings.doorstepFeeNgn)}; branch
                pickup is{" "}
                {settings.branchPickupFeeNgn === 0
                  ? "free"
                  : formatNaira(settings.branchPickupFeeNgn)}
                .
              </p>
            </section>
          </div>

          <aside className="rounded-2xl border border-gold/25 bg-[#1A1A1A]/95 p-5 shadow-2xl lg:sticky lg:top-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">
              Payment Summary
            </h2>

            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-gray-400">Items Subtotal</dt>
                <dd className="font-medium text-white">
                  {formatNaira(subtotal)}
                </dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-gray-400">Delivery Fee</dt>
                <dd className="font-medium text-white">
                  {deliveryFee === 0 ? "Free" : formatNaira(deliveryFee)}
                </dd>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base">
                <dt className="font-semibold text-white">Total Payable</dt>
                <dd className="font-bold text-gold">{formatNaira(total)}</dd>
              </div>
            </dl>

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
              >
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handlePay}
              disabled={isSubmitting}
              className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 text-sm font-bold text-black shadow-md transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Starting secure payment…
                </>
              ) : (
                <>
                  Pay with Paystack
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </button>

            {authorizationUrl ? (
              <a
                href={authorizationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center rounded-lg border border-gold/40 px-4 py-2.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/10"
              >
                Payment tab blocked? Open Paystack here
              </a>
            ) : null}

            <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-gray-500">
              <ShieldCheck
                className="mt-0.5 size-3.5 shrink-0 text-gold"
                aria-hidden="true"
              />
              Your payment is processed securely by Paystack. Your order is
              confirmed only after the transaction is verified.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
