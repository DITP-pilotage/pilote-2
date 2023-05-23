-- CreateTable
CREATE TABLE "public"."mesure_indicateur_temporaire" (
    "id" UUID NOT NULL,
    "indic_id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "metric_date" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "metric_value" TEXT NOT NULL,
    "rapport_id" UUID NOT NULL,
    "date_import" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mesure_indicateur_temporaire_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "raw_data"."mesure_indicateur" ADD CONSTRAINT "mesure_indicateur_rapport_id_fkey" FOREIGN KEY ("rapport_id") REFERENCES "public"."rapport_import_mesure_indicateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mesure_indicateur_temporaire" ADD CONSTRAINT "mesure_indicateur_temporaire_rapport_id_fkey" FOREIGN KEY ("rapport_id") REFERENCES "public"."rapport_import_mesure_indicateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
