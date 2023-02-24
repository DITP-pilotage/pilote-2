-- AlterTable
ALTER TABLE "indicateur" ALTER COLUMN "evolution_date_valeur_actuelle" SET DATA TYPE DATE[];

-- CreateTable
CREATE TABLE "axe" (
    "id" TEXT NOT NULL,
    "nom" TEXT,

    CONSTRAINT "axe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppg" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "ppg_pkey" PRIMARY KEY ("id")
);
