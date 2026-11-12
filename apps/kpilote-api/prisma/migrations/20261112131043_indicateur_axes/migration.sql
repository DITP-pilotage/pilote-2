-- CreateEnum
CREATE TYPE "fonction_agregation_axe_enum" AS ENUM ('SUM', 'AVG');

-- CreateTable
CREATE TABLE "indicateur_axe" (
    "indicateur_id" UUID NOT NULL,
    "axe_id" UUID NOT NULL,
    "ordre" INTEGER NOT NULL,
    "fonction" "fonction_agregation_axe_enum" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicateur_axe_pkey" PRIMARY KEY ("indicateur_id","axe_id")
);

-- CreateIndex
CREATE INDEX "indicateur_axe_axe_id_idx" ON "indicateur_axe"("axe_id");

-- CreateIndex
CREATE UNIQUE INDEX "indicateur_axe_indicateur_id_ordre_key" ON "indicateur_axe"("indicateur_id", "ordre");

-- AddForeignKey
ALTER TABLE "indicateur_axe" ADD CONSTRAINT "indicateur_axe_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicateur_axe" ADD CONSTRAINT "indicateur_axe_axe_id_fkey" FOREIGN KEY ("axe_id") REFERENCES "axe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

