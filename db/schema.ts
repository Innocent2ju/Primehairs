import {
  pgTable,
  serial,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// 1. Categories Table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Products Table
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    material: varchar("material", { length: 255 })
      .notNull()
      .default("100% Virgin Human Hair"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("products_created_at_idx").on(table.createdAt.desc()),
    index("products_category_id_idx").on(table.categoryId),
  ]
);

// 3. Product Images Table (Multiple images per product)
export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    altText: varchar("alt_text", { length: 255 }),
    isPrimary: boolean("is_primary").default(false).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("product_images_product_id_idx").on(table.productId),
    index("product_images_display_order_idx").on(table.displayOrder),
  ]
);

// 4. Stocks Table (Quantity + Stored Generated Status)
export const stocks = pgTable(
  "stocks",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .unique()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    status: varchar("status", { length: 20 }).generatedAlwaysAs(
      sql`CASE 
        WHEN quantity <= 0 THEN 'OUT_OF_STOCK'
        WHEN quantity <= low_stock_threshold THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
      END`
    ),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("stocks_product_id_idx").on(table.productId),
    index("stocks_status_idx").on(table.status),
  ]
);

// --- Drizzle Relations ---

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  stock: one(stocks, {
    fields: [products.id],
    references: [stocks.productId],
  }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const stocksRelations = relations(stocks, ({ one }) => ({
  product: one(products, {
    fields: [stocks.productId],
    references: [products.id],
  }),
}));
