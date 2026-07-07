-- CreateTable
CREATE TABLE "indicateur_responsable" (
    "indicateur_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicateur_responsable_pkey" PRIMARY KEY ("indicateur_id","utilisateur_id")
);

-- CreateIndex
CREATE INDEX "indicateur_responsable_indicateur_id_created_at_idx" ON "indicateur_responsable"("indicateur_id", "created_at");

-- AddForeignKey
ALTER TABLE "indicateur_responsable" ADD CONSTRAINT "indicateur_responsable_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicateur_responsable" ADD CONSTRAINT "indicateur_responsable_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
