-- AlterTable
ALTER TABLE "individu" ADD COLUMN "metadata" JSONB;

-- CreateTable
CREATE TABLE "widget" (
    "id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "join_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "widget_public_id_key" ON "widget"("public_id");

-- CreateTable
CREATE TABLE "referentiel_widget" (
    "referentiel_id" UUID NOT NULL,
    "widget_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referentiel_widget_pkey" PRIMARY KEY ("referentiel_id", "widget_id")
);

-- CreateIndex
CREATE INDEX "referentiel_widget_widget_id_idx" ON "referentiel_widget"("widget_id");

-- AddForeignKey
ALTER TABLE "referentiel_widget" ADD CONSTRAINT "referentiel_widget_referentiel_id_fkey" FOREIGN KEY ("referentiel_id") REFERENCES "referentiel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referentiel_widget" ADD CONSTRAINT "referentiel_widget_widget_id_fkey" FOREIGN KEY ("widget_id") REFERENCES "widget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
