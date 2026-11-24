"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";

import type { Product, ProductAttribute } from "@/database";
import ImageUpload from "@/components/admin/ImageUpload";
import { useAdminToast } from "@/components/admin/AdminToast";
import {
  createProduct,
  updateProduct,
} from "@/lib/admin/actions/product";
import {
  ADMIN_ATTRIBUTE_FIELDS,
  formatNaira,
  parseNaira,
  slugify,
  type ProductInput,
} from "@/lib/admin/types";
import { cn } from "@/lib/utils";

interface ProductFormProps {
  product?: Product;
}

interface PricingRuleDraft {
  attribute: ProductAttribute;
  value: string;
  price: string;
}

interface Validation {
  fieldErrors: Record<string, string>;
  rules: PricingRuleDraft[];
  input: ProductInput | null;
}

const FIELD_LIMITS = {
  title: 200,
  description: 5000,
  overview: 5000,
} as const;

const LIST_PLACEHOLDERS: Record<ProductAttribute, string> = {
  hairType: "Human Hair, Virgin Hair",
  hairVolume: "Thin, Medium, Thick",
  density: "150%, 180%, 200%",
  colors: "Natural Black, Dark Brown",
  hairLength: "12 inches, 16 inches, 20 inches",
  laceType: "Frontal Lace, Closure Lace, Full Lace",
  closureSizes: "13x4, 13x6, 4x4",
};

const splitList = (raw: string): string[] =>
  raw
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index);

const joinList = (items: readonly string[] | null | undefined): string =>
  (items ?? []).join(", ");

const initialDraft = (product?: Product): Record<ProductAttribute, string> => ({
  hairType: joinList(product?.hairType),
  hairVolume: joinList(product?.hairVolume),
  density: joinList(product?.density),
  colors: joinList(product?.colors),
  hairLength: joinList(product?.hairLength),
  laceType: joinList(product?.laceType),
  closureSizes: joinList(product?.closureSizes),
});

const initialRules = (product?: Product): PricingRuleDraft[] =>
  (product?.attributePricing ?? []).map((rule) => ({
    attribute: rule.attribute,
    value: rule.value,
    price: Number(rule.price).toFixed(2),
  }));

const labelClassName =
  "block text-[11px] font-semibold uppercase tracking-wider text-light-gray/70";
const inputClassName =
  "w-full rounded-lg border border-white/15 bg-[#1A1A1A] px-3.5 py-2.5 text-sm text-white placeholder:text-light-gray/40 outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/20";

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-white/10 bg-[#1A1A1A]/70 p-5 sm:p-6">
    <header className="mb-5">
      <h2 className="font-playfair text-lg font-bold text-white">{title}</h2>
      {description ? (
        <p className="mt-1 text-xs text-light-gray/60">{description}</p>
      ) : null}
    </header>
    {children}
  </section>
);

export default function ProductForm({ product }: ProductFormProps) {
  const isEditing = Boolean(product);

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [overview, setOverview] = useState(product?.overview ?? "");
  const [basePrice, setBasePrice] = useState(
    product ? Number(product.basePrice).toFixed(2) : "",
  );
  const [tags, setTags] = useState(joinList(product?.tags));

  const [images, setImages] = useState<string[]>(() => {
    if (!product) return [];
    return [product.image, ...(product.variants ?? [])].filter(
      (url, index, all) => Boolean(url) && all.indexOf(url) === index,
    );
  });

  const [attributes, setAttributes] = useState<Record<ProductAttribute, string>>(
    () => initialDraft(product),
  );

  const [rules, setRules] = useState<PricingRuleDraft[]>(() => initialRules(product));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const toast = useAdminToast();

  const parsedOptions = useMemo<Record<ProductAttribute, string[]>>(
    () => ({
      hairType: splitList(attributes.hairType),
      hairVolume: splitList(attributes.hairVolume),
      density: splitList(attributes.density),
      colors: splitList(attributes.colors),
      hairLength: splitList(attributes.hairLength),
      laceType: splitList(attributes.laceType),
      closureSizes: splitList(attributes.closureSizes),
    }),
    [attributes],
  );

  const optionsFor = (attribute: ProductAttribute) => parsedOptions[attribute];

  const basePriceValue = parseNaira(basePrice);

  // Mirrors the storefront: unit price = base price + every matching rule.
  const previewPrice = useMemo(() => {
    if (basePriceValue === null) return null;
    const heaviest = [...rules].sort((a, b) => {
      const priceA = parseNaira(a.price) ?? 0;
      const priceB = parseNaira(b.price) ?? 0;
      return priceB - priceA;
    })[0];
    const rulePrice = heaviest ? parseNaira(heaviest.price) : null;
    return basePriceValue + (rulePrice ?? 0);
  }, [basePriceValue, rules]);

  const setAttributeList = (attribute: ProductAttribute, raw: string) => {
    setAttributes((current) => ({ ...current, [attribute]: raw }));
  };

  const updateRule = (index: number, patch: Partial<PricingRuleDraft>) => {
    setRules((current) =>
      current.map((rule, position) =>
        position === index ? { ...rule, ...patch } : rule,
      ),
    );
  };

  const addRule = () => {
    const candidate = ADMIN_ATTRIBUTE_FIELDS.find(
      ({ key }) => optionsFor(key).length > 0,
    );
    if (!candidate) return;
    const firstValue = optionsFor(candidate.key)[0] ?? "";
    setRules((current) => [
      ...current,
      { attribute: candidate.key, value: firstValue, price: "0.00" },
    ]);
  };

  const validate = (): Validation => {
    const errors: Record<string, string> = {};
    const nextTitle = title.trim();
    const nextDescription = description.trim();
    const nextOverview = overview.trim();

    if (nextTitle.length < 2) {
      errors.title = "Enter a product name (at least 2 characters).";
    } else if (nextTitle.length > FIELD_LIMITS.title) {
      errors.title = `Keep the name under ${FIELD_LIMITS.title} characters.`;
    }

    if (!nextDescription) errors.description = "A description is required.";
    if (!nextOverview) errors.overview = "An overview is required.";
    if (images.length === 0) errors.image = "Upload at least one image.";
    if (basePriceValue === null || basePriceValue <= 0) {
      errors.basePrice = "Enter a base price greater than ₦0.";
    }

    const cleanRules: PricingRuleDraft[] = [];

    rules.forEach((rule, index) => {
      const price = parseNaira(rule.price);
      const options = optionsFor(rule.attribute);

      if (!rule.value || !options.includes(rule.value)) {
        errors[`rule-${index}`] = "Choose an option listed for this attribute.";
        return;
      }
      if (price === null || price <= 0) {
        errors[`rule-${index}`] = "The rule price must be greater than ₦0.";
        return;
      }
      cleanRules.push({ ...rule, price: price.toFixed(2) });
    });

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return { fieldErrors: errors, rules, input: null };
    }

    return {
      fieldErrors: {},
      rules,
      input: {
        title: nextTitle,
        description: nextDescription,
        overview: nextOverview,
        image: images[0],
        variants: images.slice(1),
        hairType: parsedOptions.hairType,
        hairVolume: parsedOptions.hairVolume,
        density: parsedOptions.density,
        colors: parsedOptions.colors,
        hairLength: parsedOptions.hairLength,
        laceType: parsedOptions.laceType,
        closureSizes: parsedOptions.closureSizes,
        tags: splitList(tags),
        basePrice: (basePriceValue ?? 0).toFixed(2),
        attributePricing: cleanRules.map((rule) => ({
          attribute: rule.attribute,
          value: rule.value,
          price: rule.price,
        })),
      },
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const { input } = validate();

    if (!input) {
      toast.show("Please fix the highlighted fields.", "error");
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = product
        ? await updateProduct(product.id, input)
        : await createProduct(input);

      if (result.status === "error") {
        toast.show(
          result.message,
          "error",
          result.fieldErrors && Object.keys(result.fieldErrors).length > 0
            ? "Check the highlighted fields below."
            : undefined,
        );
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    } catch (error) {
      // A successful save redirects, which surfaces here as a thrown
      // control-flow signal rather than a real failure.
      const digest = (error as { digest?: unknown })?.digest;

      if (typeof digest !== "string" || !digest.startsWith("NEXT_REDIRECT")) {
        toast.show(
          "Something went wrong while saving the product. Please try again.",
          "error",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const slugPreview = slugify(title) || "auto-generated-slug";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <Section title="Basics" description="How the product appears across the store.">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="product-title" className={labelClassName}>
              Product Name
            </label>
            <input
              id="product-title"
              value={title}
              maxLength={FIELD_LIMITS.title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Brazilian Body Wave Wig"
              className={inputClassName}
            />
            <p className="text-[11px] text-light-gray/50">
              URL slug: <span className="text-gold">/{slugPreview}</span>
            </p>
            {fieldErrors.title ? (
              <p className="text-xs text-red-400">{fieldErrors.title}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="product-overview" className={labelClassName}>
              Overview
            </label>
            <input
              id="product-overview"
              value={overview}
              maxLength={FIELD_LIMITS.overview}
              onChange={(event) => setOverview(event.target.value)}
              placeholder="A one-line summary shown beside the price"
              className={inputClassName}
            />
            {fieldErrors.overview ? (
              <p className="text-xs text-red-400">{fieldErrors.overview}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="product-description" className={labelClassName}>
              Description
            </label>
            <textarea
              id="product-description"
              value={description}
              maxLength={FIELD_LIMITS.description}
              rows={6}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tell customers what makes this piece special."
              className={cn(inputClassName, "resize-y")}
            />
            {fieldErrors.description ? (
              <p className="text-xs text-red-400">{fieldErrors.description}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-price" className={labelClassName}>
              Base Price (₦)
            </label>
            <input
              id="product-price"
              inputMode="decimal"
              value={basePrice}
              onChange={(event) => setBasePrice(event.target.value)}
              placeholder="45000.00"
              className={inputClassName}
            />
            {fieldErrors.basePrice ? (
              <p className="text-xs text-red-400">{fieldErrors.basePrice}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-tags" className={labelClassName}>
              Tags
            </label>
            <input
              id="product-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="best-seller, body-wave"
              className={inputClassName}
            />
            <p className="text-[11px] text-light-gray/50">Comma separated.</p>
          </div>
        </div>
      </Section>

      <Section
        title="Images"
        description="The first image is the main photo; the rest become the gallery."
      >
        <ImageUpload value={images} onChange={setImages} disabled={isSubmitting} />
        {fieldErrors.image ? (
          <p className="mt-2 text-xs text-red-400">{fieldErrors.image}</p>
        ) : null}
      </Section>

      <Section
        title="Hair Attributes"
        description="Comma separated options. Leave an attribute empty if it does not apply."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {ADMIN_ATTRIBUTE_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label htmlFor={`attribute-${key}`} className={labelClassName}>
                {label}
              </label>
              <input
                id={`attribute-${key}`}
                value={attributes[key]}
                onChange={(event) => setAttributeList(key, event.target.value)}
                placeholder={LIST_PLACEHOLDERS[key]}
                className={inputClassName}
              />
              <p className="text-[11px] text-light-gray/50">
                {optionsFor(key).length} option
                {optionsFor(key).length === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Attribute Pricing"
        description="Storefront price = base price + every matching rule."
      >
        {previewPrice !== null ? (
          <p className="mb-4 rounded-lg border border-gold/20 bg-gold/5 px-4 py-3 text-xs text-light-gray">
            Base {formatNaira(basePriceValue ?? 0)} · highest configuration{" "}
            <span className="font-semibold text-gold">{formatNaira(previewPrice)}</span>
          </p>
        ) : null}

        {rules.length === 0 ? (
          <p className="text-sm text-light-gray/60">
            No rules yet — every configuration uses the base price.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rules.map((rule, index) => {
              const options = optionsFor(rule.attribute);

              return (
                <li
                  key={index}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[1fr_1fr_140px_auto] sm:items-end"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClassName}>Attribute</label>
                    <select
                      aria-label={`Rule ${index + 1} attribute`}
                      value={rule.attribute}
                      onChange={(event) => {
                        const attribute = event.target.value as ProductAttribute;
                        updateRule(index, {
                          attribute,
                          value: optionsFor(attribute)[0] ?? "",
                        });
                      }}
                      className={inputClassName}
                    >
                      {ADMIN_ATTRIBUTE_FIELDS.map((field) => (
                        <option key={field.key} value={field.key}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClassName}>Option</label>
                    <select
                      aria-label={`Rule ${index + 1} option`}
                      value={rule.value}
                      onChange={(event) => updateRule(index, { value: event.target.value })}
                      className={inputClassName}
                      disabled={options.length === 0}
                    >
                      {options.length === 0 ? (
                        <option value="">No options for this attribute</option>
                      ) : null}
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClassName}>Add Price (₦)</label>
                    <input
                      aria-label={`Rule ${index + 1} additional price in naira`}
                      inputMode="decimal"
                      value={rule.price}
                      onChange={(event) => updateRule(index, { price: event.target.value })}
                      className={inputClassName}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setRules((current) => current.filter((_, position) => position !== index))
                    }
                    aria-label="Remove pricing rule"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center self-end rounded-lg border border-white/10 text-light-gray transition-colors hover:border-red-500/40 hover:text-red-400"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>

                  {fieldErrors[`rule-${index}`] ? (
                    <p className="text-xs text-red-400 sm:col-span-4">
                      {fieldErrors[`rule-${index}`]}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={addRule}
          className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gold/40 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add pricing rule
        </button>
      </Section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/admin/products"
          className="flex items-center justify-center rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gold px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {isEditing ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
