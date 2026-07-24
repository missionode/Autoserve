CREATE TYPE "CatalogRecordStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'LIMITED', 'TEMPORARILY_UNAVAILABLE', 'SOLD_OUT_TODAY');
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CHECKOUT_PENDING', 'CONVERTED', 'EXPIRED', 'ABANDONED');

CREATE TABLE "categories" (
  "id" UUID NOT NULL, "restaurant_id" UUID NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0, "status" "CatalogRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL, CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "categories_name_not_blank" CHECK (length(btrim("name")) > 0),
  CONSTRAINT "categories_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT "categories_sort_order_nonnegative" CHECK ("sort_order" >= 0),
  CONSTRAINT "categories_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "menu_items" (
  "id" UUID NOT NULL, "restaurant_id" UUID NOT NULL, "category_id" UUID NOT NULL, "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL, "description" TEXT, "price_minor" BIGINT NOT NULL,
  "currency_code" CHAR(3) NOT NULL DEFAULT 'INR', "is_vegetarian" BOOLEAN NOT NULL DEFAULT false,
  "status" "CatalogRecordStatus" NOT NULL DEFAULT 'DRAFT', "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "menu_items_name_not_blank" CHECK (length(btrim("name")) > 0),
  CONSTRAINT "menu_items_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT "menu_items_price_nonnegative" CHECK ("price_minor" >= 0),
  CONSTRAINT "menu_items_currency_uppercase" CHECK ("currency_code" ~ '^[A-Z]{3}$'),
  CONSTRAINT "menu_items_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "menu_item_availability" (
  "id" UUID NOT NULL, "restaurant_id" UUID NOT NULL, "menu_item_id" UUID NOT NULL,
  "status" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE', "remaining_count" INTEGER,
  "unavailable_until" TIMESTAMPTZ(3), "reason" TEXT, "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "menu_item_availability_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "menu_item_availability_remaining_nonnegative" CHECK ("remaining_count" IS NULL OR "remaining_count" >= 0),
  CONSTRAINT "menu_item_availability_limited_count" CHECK ("status" <> 'LIMITED' OR "remaining_count" IS NOT NULL),
  CONSTRAINT "menu_item_availability_reason_not_blank" CHECK ("reason" IS NULL OR length(btrim("reason")) > 0),
  CONSTRAINT "menu_item_availability_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "carts" (
  "id" UUID NOT NULL, "restaurant_id" UUID NOT NULL, "customer_id" UUID, "guest_key" TEXT,
  "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE', "currency_code" CHAR(3) NOT NULL DEFAULT 'INR',
  "expires_at" TIMESTAMPTZ(3) NOT NULL, "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "carts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "carts_owner_present" CHECK ("customer_id" IS NOT NULL OR ("guest_key" IS NOT NULL AND length(btrim("guest_key")) > 0)),
  CONSTRAINT "carts_currency_uppercase" CHECK ("currency_code" ~ '^[A-Z]{3}$'),
  CONSTRAINT "carts_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "cart_lines" (
  "id" UUID NOT NULL, "restaurant_id" UUID NOT NULL, "cart_id" UUID NOT NULL, "menu_item_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL, "item_name_snapshot" TEXT NOT NULL, "unit_price_minor_snapshot" BIGINT NOT NULL,
  "line_total_minor" BIGINT NOT NULL, "configuration_snapshot" JSONB NOT NULL DEFAULT '{}',
  "version" INTEGER NOT NULL DEFAULT 1, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL, CONSTRAINT "cart_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cart_lines_quantity_positive" CHECK ("quantity" > 0),
  CONSTRAINT "cart_lines_name_not_blank" CHECK (length(btrim("item_name_snapshot")) > 0),
  CONSTRAINT "cart_lines_unit_price_nonnegative" CHECK ("unit_price_minor_snapshot" >= 0),
  CONSTRAINT "cart_lines_total_exact" CHECK ("line_total_minor" = "unit_price_minor_snapshot" * "quantity"),
  CONSTRAINT "cart_lines_configuration_object" CHECK (jsonb_typeof("configuration_snapshot") = 'object'),
  CONSTRAINT "cart_lines_version_positive" CHECK ("version" > 0)
);

CREATE INDEX "categories_restaurant_id_status_sort_order_idx" ON "categories"("restaurant_id", "status", "sort_order");
CREATE UNIQUE INDEX "categories_restaurant_id_slug_key" ON "categories"("restaurant_id", "slug");
CREATE UNIQUE INDEX "categories_id_restaurant_id_key" ON "categories"("id", "restaurant_id");
CREATE INDEX "menu_items_restaurant_id_category_id_status_idx" ON "menu_items"("restaurant_id", "category_id", "status");
CREATE UNIQUE INDEX "menu_items_restaurant_id_slug_key" ON "menu_items"("restaurant_id", "slug");
CREATE UNIQUE INDEX "menu_items_id_restaurant_id_key" ON "menu_items"("id", "restaurant_id");
CREATE UNIQUE INDEX "menu_item_availability_menu_item_id_key" ON "menu_item_availability"("menu_item_id");
CREATE INDEX "menu_item_availability_restaurant_id_status_idx" ON "menu_item_availability"("restaurant_id", "status");
CREATE UNIQUE INDEX "menu_item_availability_menu_item_id_restaurant_id_key" ON "menu_item_availability"("menu_item_id", "restaurant_id");
CREATE INDEX "carts_restaurant_id_status_expires_at_idx" ON "carts"("restaurant_id", "status", "expires_at");
CREATE INDEX "carts_customer_id_status_idx" ON "carts"("customer_id", "status");
CREATE INDEX "carts_guest_key_status_idx" ON "carts"("guest_key", "status");
CREATE UNIQUE INDEX "carts_id_restaurant_id_key" ON "carts"("id", "restaurant_id");
CREATE INDEX "cart_lines_restaurant_id_cart_id_idx" ON "cart_lines"("restaurant_id", "cart_id");
CREATE INDEX "cart_lines_restaurant_id_menu_item_id_idx" ON "cart_lines"("restaurant_id", "menu_item_id");

ALTER TABLE "categories" ADD CONSTRAINT "categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_restaurant_id_fkey" FOREIGN KEY ("category_id", "restaurant_id") REFERENCES "categories"("id", "restaurant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "menu_item_availability" ADD CONSTRAINT "menu_item_availability_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "menu_item_availability" ADD CONSTRAINT "menu_item_availability_menu_item_id_restaurant_id_fkey" FOREIGN KEY ("menu_item_id", "restaurant_id") REFERENCES "menu_items"("id", "restaurant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "carts" ADD CONSTRAINT "carts_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_cart_id_restaurant_id_fkey" FOREIGN KEY ("cart_id", "restaurant_id") REFERENCES "carts"("id", "restaurant_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_menu_item_id_restaurant_id_fkey" FOREIGN KEY ("menu_item_id", "restaurant_id") REFERENCES "menu_items"("id", "restaurant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
