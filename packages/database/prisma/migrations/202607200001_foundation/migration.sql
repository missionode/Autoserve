CREATE TABLE "foundation_probes" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "foundation_probes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "foundation_probes_name_key" UNIQUE ("name")
);
