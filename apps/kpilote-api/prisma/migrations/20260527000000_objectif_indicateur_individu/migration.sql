-- CreateTable
CREATE TABLE "objectif_indicateur_individu" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "indicateur_id" UUID NOT NULL,
    "individu_id" UUID NOT NULL,
    "date_cible" TEXT NOT NULL,
    "valeur_cible" DECIMAL(20,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "objectif_indicateur_individu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "objectif_indicateur_individu_indicateur_id_individu_id_idx" ON "objectif_indicateur_individu"("indicateur_id", "individu_id");

-- CreateIndex
CREATE INDEX "objectif_indicateur_individu_indicateur_id_date_cible_idx" ON "objectif_indicateur_individu"("indicateur_id", "date_cible");

-- CreateIndex
CREATE UNIQUE INDEX "objectif_indicateur_individu_indicateur_id_individu_id_date_cible_key" ON "objectif_indicateur_individu"("indicateur_id", "individu_id", "date_cible");

-- AddForeignKey
ALTER TABLE "objectif_indicateur_individu" ADD CONSTRAINT "objectif_indicateur_individu_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectif_indicateur_individu" ADD CONSTRAINT "objectif_indicateur_individu_individu_id_fkey" FOREIGN KEY ("individu_id") REFERENCES "individu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
