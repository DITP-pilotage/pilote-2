-- CreateTable
DROP TABLE IF EXISTS "raw_data"."metadata_zones" CASCADE;
CREATE TABLE "raw_data"."metadata_zones" (
    "zone_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "zone_code" TEXT NOT NULL,
    "zone_type" TEXT NOT NULL,
    "zone_parent" TEXT,

    CONSTRAINT "metadata_zones_pkey" PRIMARY KEY ("zone_id")
);

-- CreateTable
DROP TABLE IF EXISTS "raw_data"."metadata_chantiers" CASCADE;
CREATE TABLE "raw_data"."metadata_chantiers" (
    "chantier_id" TEXT NOT NULL,
    "ch_nom" TEXT NOT NULL,
    "ch_descr" TEXT,
    "ch_ppg" TEXT NOT NULL,
    "ch_territo" BOOLEAN NOT NULL DEFAULT false,
    "engagement_short" TEXT,
    "ch_hidden_pilote" BOOLEAN NOT NULL DEFAULT false,
    "ch_saisie_ate" "public"."type_ate",
    "ch_state" "public"."type_statut" NOT NULL,
    "zg_applicable" TEXT,
    "porteur_ids_noDAC" TEXT,
    "porteur_shorts_noDAC" TEXT,
    "porteur_ids_DAC" TEXT,
    "porteur_shorts_DAC" TEXT,
    "ch_per" TEXT NOT NULL,
    "maille_applicable" TEXT,
    "replicate_val_reg_to" TEXT,
    "replicate_val_nat_to" TEXT,
    "ch_cible_attendue" BOOLEAN NOT NULL,
    "conseiller_mail" TEXT,

    CONSTRAINT "metadata_chantiers_pkey" PRIMARY KEY ("chantier_id")
);

-- CreateTable
DROP TABLE IF EXISTS "raw_data"."metadata_ppgs" CASCADE;
CREATE TABLE "raw_data"."metadata_ppgs" (
    "ppg_id" TEXT NOT NULL,
    "ppg_nom" TEXT NOT NULL,
    "ppg_desc" TEXT,
    "ppg_axe" TEXT,

    CONSTRAINT "metadata_ppgs_pkey" PRIMARY KEY ("ppg_id")
);

-- CreateTable
DROP TABLE IF EXISTS "raw_data"."metadata_porteurs" CASCADE;
CREATE TABLE "raw_data"."metadata_porteurs" (
    "porteur_id" TEXT NOT NULL,
    "porteur_short" TEXT NOT NULL,
    "porteur_name" TEXT NOT NULL,
    "porteur_desc" TEXT,
    "porteur_type_id" TEXT,
    "porteur_type_short" TEXT,
    "porteur_directeur" TEXT,
    "porteur_name_short" TEXT,
    "porteur_picto" TEXT,

    CONSTRAINT "metadata_porteurs_pkey" PRIMARY KEY ("porteur_id")
);

-- CreateTable
DROP TABLE IF EXISTS "raw_data"."metadata_perimetres" CASCADE;
CREATE TABLE "raw_data"."metadata_perimetres" (
    "perimetre_id" TEXT NOT NULL,
    "per_nom" TEXT NOT NULL,
    "per_porteur_id" TEXT,
    "per_porteur_name_short" TEXT,

    CONSTRAINT "metadata_perimetres_pkey" PRIMARY KEY ("perimetre_id")
);

-- CreateTable
DROP TABLE IF EXISTS "raw_data"."metadata_axes" CASCADE;
CREATE TABLE "raw_data"."metadata_axes" (
    "axe_id" TEXT NOT NULL,
    "axe_name" TEXT NOT NULL,
    "axe_desc" TEXT,

    CONSTRAINT "metadata_axes_pkey" PRIMARY KEY ("axe_id")
);

-- CreateTable
DROP TABLE IF EXISTS "raw_data"."metadata_engagement" CASCADE;
CREATE TABLE "raw_data"."metadata_engagement" (
    "engagement_id" TEXT NOT NULL,
    "engagement_short" TEXT NOT NULL,
    "engagement_name" TEXT NOT NULL,

    CONSTRAINT "metadata_engagement_pkey" PRIMARY KEY ("engagement_id")
);

-- CreateTable
DROP TABLE IF EXISTS "raw_data"."metadata_indicateur_types" CASCADE;
CREATE TABLE "raw_data"."metadata_indicateur_types" (
    "indic_type_id" TEXT NOT NULL,
    "indic_type_name" TEXT NOT NULL,
    "indic_type_descr" TEXT,

    CONSTRAINT "metadata_indicateur_types_pkey" PRIMARY KEY ("indic_type_id")
);

-- CreateTable
DROP TABLE IF EXISTS "raw_data"."metadata_zonegroup" CASCADE;
CREATE TABLE "raw_data"."metadata_zonegroup" (
    "zone_group_id" TEXT NOT NULL,
    "zg_zones" TEXT NOT NULL,

    CONSTRAINT "metadata_zonegroup_pkey" PRIMARY KEY ("zone_group_id")
);
