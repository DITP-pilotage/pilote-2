-- CreateTable
CREATE TABLE "indicateur_referentiel" (
    "indicateur_id" UUID NOT NULL,
    "referentiel_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicateur_referentiel_pkey" PRIMARY KEY ("indicateur_id","referentiel_id")
);

-- CreateIndex
CREATE INDEX "indicateur_referentiel_referentiel_id_idx" ON "indicateur_referentiel"("referentiel_id");

-- AddForeignKey
ALTER TABLE "indicateur_referentiel" ADD CONSTRAINT "indicateur_referentiel_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicateur_referentiel" ADD CONSTRAINT "indicateur_referentiel_referentiel_id_fkey" FOREIGN KEY ("referentiel_id") REFERENCES "referentiel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
