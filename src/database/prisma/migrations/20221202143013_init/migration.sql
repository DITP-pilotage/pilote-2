-- CreateTable
CREATE TABLE "chantier" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "id_perimetre" TEXT NOT NULL,

    CONSTRAINT "chantier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perimetre" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "perimetre_pkey" PRIMARY KEY ("id")
);
