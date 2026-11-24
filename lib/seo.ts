import type { Metadata } from "next";

/** Canonical brand name used in OpenGraph and structured metadata. */
export const SITE_NAME = "PrimeHairs";

/** Site-wide title, also used as the fallback when a page defines none. */
export const SITE_DEFAULT_TITLE =
  "PrimeHairs — Luxury Raw Hair Wigs, Bundles & Extensions";

/** Suffix applied to page titles by the root layout. */
export const SITE_TITLE_TEMPLATE = "%s | PrimeHairs";

/** Default description emphasising the storefront's core catalogue. */
export const SITE_DEFAULT_DESCRIPTION =
  "Shop 100% raw human hair wigs, bundles and extensions at PrimeHairs. Luxury hair, pre-plucked lace and seamless closures, delivered across Nigeria.";

/** Default share image, resolved to an absolute URL at metadata build time. */
export const SITE_DEFAULT_OG_IMAGE = "/og-default.png";

export const SITE_DEFAULT_OG_IMAGE_ALT =
  "PrimeHairs raw human hair wigs, bundles and extensions";

/** Used when NEXT_PUBLIC_BASE_URL is not configured. */
const FALLBACK_SITE_URL = "https://primehairs.co";

/** Absolute origin for canonical URLs and social images (no trailing slash). */
export const siteUrl: string = (
  process.env.NEXT_PUBLIC_BASE_URL?.trim() || FALLBACK_SITE_URL
).replace(/\/+$/, "");

/** Route paths are stored without a trailing slash, always rooted at "/". */
const normalizePath = (path: string): string => {
  const trimmed = path.trim();

  if (!trimmed || trimmed === "/") return "/";

  const rooted = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  return rooted.replace(/\/+$/, "") || "/";
};

/** Joins a route path onto the canonical origin. */
export const absoluteUrl = (path: string): string => {
  const normalized = normalizePath(path);

  return normalized === "/" ? siteUrl : `${siteUrl}${normalized}`;
};

/**
 * Resolves a DB/Cloudinary image URL or a local `/public` path to an absolute
 * URL, falling back to the default share image when none is provided.
 */
const resolveImageUrl = (image?: string | null): string => {
  const candidate = image?.trim() || SITE_DEFAULT_OG_IMAGE;

  try {
    return new URL(candidate, `${siteUrl}/`).toString();
  } catch {
    return new URL(SITE_DEFAULT_OG_IMAGE, `${siteUrl}/`).toString();
  }
};

export interface PageMetadataInput {
  /** Page title. The root layout appends ` | PrimeHairs` unless absolute. */
  title: string;
  description?: string;
  /** Canonical route path, e.g. `/products/raw-body-wave`. */
  path?: string;
  /** Product image (Cloudinary URL) or `/public` path; falls back to OG default. */
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  keywords?: string[];
  /** Bypass the root title template (used by the home page). */
  absoluteTitle?: boolean;
  robots?: Metadata["robots"];
}

/**
 * Builds consistent page metadata: title, description, canonical URL,
 * OpenGraph (WhatsApp, Telegram, Facebook, LinkedIn, Discord, Slack) and
 * Twitter/X card tags, with a guaranteed share image.
 */
export function buildPageMetadata({
  title,
  description,
  path = "/",
  image,
  imageAlt,
  type = "website",
  keywords,
  absoluteTitle = false,
  robots,
}: PageMetadataInput): Metadata {
  const resolvedTitle = title.trim() || SITE_DEFAULT_TITLE;
  const resolvedDescription = description?.trim() || SITE_DEFAULT_DESCRIPTION;
  const canonicalPath = normalizePath(path);
  const imageUrl = resolveImageUrl(image);
  const resolvedImageAlt = imageAlt?.trim() || resolvedTitle;

  return {
    title: absoluteTitle ? { absolute: resolvedTitle } : resolvedTitle,
    description: resolvedDescription,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: absoluteUrl(canonicalPath),
      siteName: SITE_NAME,
      type,
      images: [{ url: imageUrl, alt: resolvedImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [{ url: imageUrl, alt: resolvedImageAlt }],
    },
    ...(robots ? { robots } : {}),
  };
}

/**
 * Root-level defaults shared by every route. The title template only applies
 * to child segments; `metadataBase` makes relative canonical paths absolute.
 */
export function buildRootMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    ...buildPageMetadata({
      title: SITE_DEFAULT_TITLE,
      description: SITE_DEFAULT_DESCRIPTION,
      path: "/",
      absoluteTitle: true,
    }),
    title: {
      default: SITE_DEFAULT_TITLE,
      template: SITE_TITLE_TEMPLATE,
    },
    applicationName: SITE_NAME,
    keywords: [
      "raw hair wigs",
      "human hair bundles",
      "hair extensions",
      "luxury wigs",
      "PrimeHairs",
    ],
  };
}
