import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { products, type Product } from "@/database";
import { db } from "@/lib/drizzleconnect";

type RouteContext = { params: Promise<{ slug: string }> };

// Slugs are generated from the title: lowercase words joined by single hyphens.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 200;

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    if (!slug?.trim()) {
      return NextResponse.json(
        { message: "Slug is required" },
        { status: 400 },
      );
    }

    // Normalize to the form the database stores so lookups are case-insensitive.
    const normalized = slug.trim().toLowerCase();

    if (normalized.length > MAX_SLUG_LENGTH || !SLUG_PATTERN.test(normalized)) {
      return NextResponse.json(
        { message: `Invalid slug: "${slug}"` },
        { status: 400 },
      );
    }

    const [product]: Product[] = await db
      .select()
      .from(products)
      .where(eq(products.slug, normalized))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { message: `Product with slug "${normalized}" not found` },
        { status: 404 },
      );
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    // Never leak driver internals to the client.
    console.error("GET /api/products/[slug] failed:", error);
    return NextResponse.json(
      { message: "Failed to fetch product" },
      { status: 500 },
    );
  }
}
