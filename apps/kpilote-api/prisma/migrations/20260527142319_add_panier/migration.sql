-- AlterTable
ALTER TABLE "objectif_indicateur_individu" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "panier" (
    "id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "panier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "panier_indicateur" (
    "panier_id" UUID NOT NULL,
    "indicateur_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "panier_indicateur_pkey" PRIMARY KEY ("panier_id","indicateur_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "panier_public_id_key" ON "panier"("public_id");

-- CreateIndex
CREATE INDEX "panier_indicateur_panier_id_created_at_idx" ON "panier_indicateur"("panier_id", "created_at");

-- AddForeignKey
ALTER TABLE "panier_indicateur" ADD CONSTRAINT "panier_indicateur_panier_id_fkey" FOREIGN KEY ("panier_id") REFERENCES "panier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panier_indicateur" ADD CONSTRAINT "panier_indicateur_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "objectif_indicateur_individu_indicateur_id_individu_id_date_cib" RENAME TO "objectif_indicateur_individu_indicateur_id_individu_id_date_key";
