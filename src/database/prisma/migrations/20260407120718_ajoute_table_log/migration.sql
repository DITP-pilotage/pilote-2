-- CreateEnum
CREATE TYPE "public"."log_level" AS ENUM ('INFO', 'WARN', 'ERROR', 'DEBUG');

-- CreateTable
CREATE TABLE "public"."application_log" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" "public"."log_level" NOT NULL,
    "categorie" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "contexte" JSONB,
    "source" TEXT,
    "duree_ms" INTEGER,

    CONSTRAINT "application_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "application_log_timestamp_idx" ON "public"."application_log"("timestamp");

-- CreateIndex
CREATE INDEX "application_log_categorie_idx" ON "public"."application_log"("categorie");

-- CreateIndex
CREATE INDEX "application_log_level_idx" ON "public"."application_log"("level");

-- CreateIndex
CREATE INDEX "application_log_categorie_timestamp_idx" ON "public"."application_log"("categorie", "timestamp");
