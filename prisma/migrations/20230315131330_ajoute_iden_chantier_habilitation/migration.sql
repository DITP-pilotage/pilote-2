-- CreateTable
CREATE TABLE "iden_chantier_habilitation" (
    "chantier_id" TEXT NOT NULL,
    "identite_id" TEXT NOT NULL,
    "scope" TEXT[],

    CONSTRAINT "iden_chantier_habilitation_pkey" PRIMARY KEY ("chantier_id","identite_id")
);
