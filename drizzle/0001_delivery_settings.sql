CREATE TABLE "delivery_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"doorstep_fee_ngn" numeric(12, 2) DEFAULT '2000.00' NOT NULL,
	"branch_pickup_fee_ngn" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"branch_locations" text[] DEFAULT '{"Lagos Branch","Enugu Branch","Abuja Branch"}' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "delivery_settings" ("id") VALUES ('default') ON CONFLICT ("id") DO NOTHING;
