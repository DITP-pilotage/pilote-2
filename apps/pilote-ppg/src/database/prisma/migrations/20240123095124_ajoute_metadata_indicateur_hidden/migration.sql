-- CreateTable
CREATE TABLE "raw_data"."metadata_indicateurs_hidden" (
    "indic_id" TEXT NOT NULL,
    "indic_parent_indic" TEXT,
    "indic_parent_ch" TEXT NOT NULL,
    "indic_nom" TEXT NOT NULL,
    "indic_nom_baro" TEXT,
    "indic_descr" TEXT,
    "indic_descr_baro" TEXT,
    "indic_is_perseverant" BOOLEAN,
    "indic_is_phare" BOOLEAN,
    "indic_is_baro" BOOLEAN,
    "indic_type" TEXT,
    "indic_source" TEXT,
    "indic_source_url" TEXT,
    "indic_methode_calcul" TEXT,
    "indic_unite" TEXT,
    "indic_hidden_pilote" BOOLEAN,
    "indic_schema" TEXT,
    "zg_applicable" TEXT,

    CONSTRAINT "metadata_indicateurs_hidden_pkey" PRIMARY KEY ("indic_id")
);
