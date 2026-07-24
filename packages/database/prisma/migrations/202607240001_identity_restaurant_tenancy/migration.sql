CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DISABLED');
CREATE TYPE "AuthProvider" AS ENUM ('PASSWORD', 'GOOGLE', 'MOBILE_OTP', 'STAFF_ID');
CREATE TYPE "RestaurantStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'CLOSED');
CREATE TYPE "MembershipRole" AS ENUM ('ADMIN', 'STAFF');
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED');
CREATE TYPE "LicenceStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'REPLACED');
CREATE TYPE "ApprovalDecisionType" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'SUSPENDED', 'REACTIVATED');

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "display_name" TEXT NOT NULL,
  "primary_email" TEXT,
  "primary_mobile" TEXT,
  "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_display_name_not_blank" CHECK (length(btrim("display_name")) > 0),
  CONSTRAINT "users_email_normalized" CHECK ("primary_email" IS NULL OR "primary_email" = lower(btrim("primary_email"))),
  CONSTRAINT "users_mobile_not_blank" CHECK ("primary_mobile" IS NULL OR length(btrim("primary_mobile")) > 0),
  CONSTRAINT "users_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "auth_identities" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "provider" "AuthProvider" NOT NULL,
  "provider_subject" TEXT NOT NULL,
  "normalized_handle" TEXT,
  "verified_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "auth_identities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "auth_identities_subject_not_blank" CHECK (length(btrim("provider_subject")) > 0),
  CONSTRAINT "auth_identities_handle_normalized" CHECK ("normalized_handle" IS NULL OR (length(btrim("normalized_handle")) > 0 AND "normalized_handle" = lower(btrim("normalized_handle"))))
);

CREATE TABLE "restaurants" (
  "id" UUID NOT NULL,
  "legal_name" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" "RestaurantStatus" NOT NULL DEFAULT 'DRAFT',
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "currency_code" CHAR(3) NOT NULL DEFAULT 'INR',
  "complaint_phone" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "restaurants_legal_name_not_blank" CHECK (length(btrim("legal_name")) > 0),
  CONSTRAINT "restaurants_display_name_not_blank" CHECK (length(btrim("display_name")) > 0),
  CONSTRAINT "restaurants_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT "restaurants_timezone_not_blank" CHECK (length(btrim("timezone")) > 0),
  CONSTRAINT "restaurants_currency_uppercase" CHECK ("currency_code" ~ '^[A-Z]{3}$'),
  CONSTRAINT "restaurants_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "restaurant_memberships" (
  "id" UUID NOT NULL,
  "restaurant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" "MembershipRole" NOT NULL,
  "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
  "staff_code" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "restaurant_memberships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "restaurant_memberships_staff_code_not_blank" CHECK ("staff_code" IS NULL OR length(btrim("staff_code")) > 0),
  CONSTRAINT "restaurant_memberships_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "restaurant_licences" (
  "id" UUID NOT NULL,
  "restaurant_id" UUID NOT NULL,
  "licence_type" TEXT NOT NULL,
  "licence_number" TEXT,
  "private_object_key" TEXT NOT NULL,
  "status" "LicenceStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "issued_at" DATE,
  "expires_at" DATE,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "restaurant_licences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "restaurant_licences_type_not_blank" CHECK (length(btrim("licence_type")) > 0),
  CONSTRAINT "restaurant_licences_number_not_blank" CHECK ("licence_number" IS NULL OR length(btrim("licence_number")) > 0),
  CONSTRAINT "restaurant_licences_object_key_not_blank" CHECK (length(btrim("private_object_key")) > 0),
  CONSTRAINT "restaurant_licences_valid_dates" CHECK ("issued_at" IS NULL OR "expires_at" IS NULL OR "expires_at" >= "issued_at"),
  CONSTRAINT "restaurant_licences_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "restaurant_tables" (
  "id" UUID NOT NULL,
  "restaurant_id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "capacity" INTEGER,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "restaurant_tables_code_not_blank" CHECK (length(btrim("code")) > 0),
  CONSTRAINT "restaurant_tables_display_name_not_blank" CHECK (length(btrim("display_name")) > 0),
  CONSTRAINT "restaurant_tables_capacity_positive" CHECK ("capacity" IS NULL OR "capacity" > 0),
  CONSTRAINT "restaurant_tables_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "pickup_counters" (
  "id" UUID NOT NULL,
  "restaurant_id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "pickup_counters_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pickup_counters_code_not_blank" CHECK (length(btrim("code")) > 0),
  CONSTRAINT "pickup_counters_display_name_not_blank" CHECK (length(btrim("display_name")) > 0),
  CONSTRAINT "pickup_counters_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "approval_decisions" (
  "id" UUID NOT NULL,
  "restaurant_id" UUID NOT NULL,
  "decision" "ApprovalDecisionType" NOT NULL,
  "reason" TEXT,
  "decided_by_id" UUID,
  "decided_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "correlation_id" UUID NOT NULL,
  CONSTRAINT "approval_decisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "approval_decisions_reason_not_blank" CHECK ("reason" IS NULL OR length(btrim("reason")) > 0)
);

CREATE UNIQUE INDEX "users_primary_email_key" ON "users"("primary_email");
CREATE UNIQUE INDEX "users_primary_mobile_key" ON "users"("primary_mobile");
CREATE INDEX "auth_identities_user_id_idx" ON "auth_identities"("user_id");
CREATE UNIQUE INDEX "auth_identities_provider_provider_subject_key" ON "auth_identities"("provider", "provider_subject");
CREATE UNIQUE INDEX "auth_identities_provider_normalized_handle_key" ON "auth_identities"("provider", "normalized_handle");
CREATE UNIQUE INDEX "restaurants_slug_key" ON "restaurants"("slug");
CREATE INDEX "restaurant_memberships_user_id_status_idx" ON "restaurant_memberships"("user_id", "status");
CREATE INDEX "restaurant_memberships_restaurant_id_role_status_idx" ON "restaurant_memberships"("restaurant_id", "role", "status");
CREATE UNIQUE INDEX "restaurant_memberships_restaurant_id_user_id_key" ON "restaurant_memberships"("restaurant_id", "user_id");
CREATE UNIQUE INDEX "restaurant_memberships_restaurant_id_staff_code_key" ON "restaurant_memberships"("restaurant_id", "staff_code");
CREATE INDEX "restaurant_licences_restaurant_id_status_expires_at_idx" ON "restaurant_licences"("restaurant_id", "status", "expires_at");
CREATE UNIQUE INDEX "restaurant_licences_restaurant_id_licence_type_licence_number_key" ON "restaurant_licences"("restaurant_id", "licence_type", "licence_number");
CREATE INDEX "restaurant_tables_restaurant_id_is_active_idx" ON "restaurant_tables"("restaurant_id", "is_active");
CREATE UNIQUE INDEX "restaurant_tables_restaurant_id_code_key" ON "restaurant_tables"("restaurant_id", "code");
CREATE INDEX "pickup_counters_restaurant_id_is_active_idx" ON "pickup_counters"("restaurant_id", "is_active");
CREATE UNIQUE INDEX "pickup_counters_restaurant_id_code_key" ON "pickup_counters"("restaurant_id", "code");
CREATE INDEX "approval_decisions_restaurant_id_decided_at_idx" ON "approval_decisions"("restaurant_id", "decided_at");
CREATE INDEX "approval_decisions_decided_by_id_decided_at_idx" ON "approval_decisions"("decided_by_id", "decided_at");
CREATE INDEX "approval_decisions_correlation_id_idx" ON "approval_decisions"("correlation_id");

ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "restaurant_memberships" ADD CONSTRAINT "restaurant_memberships_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "restaurant_memberships" ADD CONSTRAINT "restaurant_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "restaurant_licences" ADD CONSTRAINT "restaurant_licences_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pickup_counters" ADD CONSTRAINT "pickup_counters_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
