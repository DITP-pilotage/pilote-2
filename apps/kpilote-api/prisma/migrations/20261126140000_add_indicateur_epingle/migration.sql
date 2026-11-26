-- CreateTable
CREATE TABLE "indicateur_epingle" (
    "utilisateur_id" UUID NOT NULL,
    "indicateur_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicateur_epingle_pkey" PRIMARY KEY ("utilisateur_id","indicateur_id")
);

-- CreateIndex
CREATE INDEX "indicateur_epingle_indicateur_id_idx" ON "indicateur_epingle"("indicateur_id");

-- AddForeignKey
ALTER TABLE "indicateur_epingle" ADD CONSTRAINT "indicateur_epingle_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicateur_epingle" ADD CONSTRAINT "indicateur_epingle_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
