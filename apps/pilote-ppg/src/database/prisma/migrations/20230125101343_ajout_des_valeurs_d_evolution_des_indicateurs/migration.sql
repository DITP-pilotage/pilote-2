-- AlterTable
ALTER TABLE "indicateur"
    ADD COLUMN     "evolution_valeur_actuelle" DOUBLE PRECISION[],
    ADD COLUMN     "evolution_date_valeur_actuelle" TIMESTAMP(3)[];
