import { sql } from "drizzle-orm";
import {
  jsonb,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Attributes an admin can price individually. Kept as a union so a pricing rule
// can never point at a column that does not exist on the product.
export type ProductAttribute =
  | "hairType"
  | "hairVolume"
  | "density"
  | "colors"
  | "hairLength"
  | "laceType"
  | "closureSizes";

// One admin-defined rule: "when this attribute has this value, add this price".
// Price is a decimal string so money never passes through a float.
export type AttributePricingRule = {
  attribute: ProductAttribute;
  value: string;
  price: string;
};

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    // Stored generated column: the database derives the slug from the title, so
    // it cannot drift from the title or be set to something inconsistent.
    slug: text("slug")
      .notNull()
      .generatedAlwaysAs(
        sql`lower(trim(both '-' from regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')))`,
      ),
    description: text("description").notNull(),
    overview: text("overview").notNull(),
    image: text("image").notNull(),
    // Variant images for the same product; text[] keeps them ordered and queryable.
    variants: text("variants").array().notNull(),
    hairType: text("hair_type").array().notNull(),
    hairVolume: text("hair_volume").array().notNull(),
    density: text("density").array().notNull(),
    colors: text("colors").array().notNull(),
    hairLength: text("hair_length").array().notNull(),
    laceType: text("lace_type").array().notNull(),
    closureSizes: text("closure_sizes").array().notNull(),
    tags: text("tags").array().notNull(),
    // Starting price; the final price is basePrice plus matching pricing rules.
    basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
    // Rules are opaque to the database, so JSONB avoids a join table per attribute.
    attributePricing: jsonb("attribute_pricing")
      .$type<AttributePricingRule[]>()
      .notNull(),
  },
  (t) => [uniqueIndex("products_slug_idx").on(t.slug)],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
