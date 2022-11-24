-- CreateTable
CREATE TABLE "chantier_prioritaire" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "axe" TEXT,
    "ppg" TEXT,
    "porteur" TEXT,

    CONSTRAINT "chantier_prioritaire_pkey" PRIMARY KEY ("id")
);

