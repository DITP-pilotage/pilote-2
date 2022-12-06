-- CreateTable
CREATE TABLE "metadata_chantier" (
    "chantier_id" TEXT NOT NULL,
    "ch_code" TEXT,
    "ch_descr" TEXT,
    "ch_nom" TEXT NOT NULL,
    "ch_ppg" TEXT NOT NULL,
    "ch_perseverant" TEXT,
    "porteur_shorts_noDAC" TEXT NOT NULL,
    "porteur_ids_noDAC" TEXT NOT NULL,
    "porteur_shorts_DAC" TEXT,
    "porteur_ids_DAC" TEXT,
    "ch_per" TEXT NOT NULL,

    CONSTRAINT "metadata_chantier_pkey" PRIMARY KEY ("chantier_id")
);

-- CreateTable
CREATE TABLE "metadata_perimetre" (
    "perimetre_id" TEXT NOT NULL,
    "per_nom" TEXT NOT NULL,
    "per_short" TEXT,
    "per_picto" TEXT,

    CONSTRAINT "metadata_perimetre_pkey" PRIMARY KEY ("perimetre_id")
);
