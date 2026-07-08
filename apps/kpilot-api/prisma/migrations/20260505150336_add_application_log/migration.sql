-- CreateEnum
CREATE TYPE "application_log_level_enum" AS ENUM ('ERROR', 'WARN', 'INFO', 'DEBUG');

-- CreateTable
CREATE TABLE "application_log" (
    "id" BIGSERIAL NOT NULL,
    "level" "application_log_level_enum" NOT NULL,
    "categorie" TEXT NOT NULL DEFAULT 'systeme',
    "message" TEXT NOT NULL,
    "contexte" JSONB,
    "source" TEXT,
    "duree_ms" INTEGER,
    "request_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "application_log_date_idx" ON "application_log"("date");

-- CreateIndex
CREATE INDEX "application_log_level_date_idx" ON "application_log"("level", "date");

-- CreateIndex
CREATE INDEX "application_log_request_id_idx" ON "application_log"("request_id");
