-- CreateTable
CREATE TABLE "raw_data"."metadata_indicateurs" (
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

    CONSTRAINT "metadata_indicateurs_pkey" PRIMARY KEY ("indic_id")
);

-- CreateTable
CREATE TABLE "raw_data"."metadata_parametrage_indicateurs" (
    "indic_id" TEXT NOT NULL,
    "vi_dept_from" TEXT,
    "vi_dept_op" TEXT,
    "va_dept_from" TEXT,
    "va_dept_op" TEXT,
    "vc_dept_from" TEXT,
    "vc_dept_op" TEXT,
    "vi_reg_from" TEXT,
    "vi_reg_op" TEXT,
    "va_reg_from" TEXT,
    "va_reg_op" TEXT,
    "vc_reg_from" TEXT,
    "vc_reg_op" TEXT,
    "vi_nat_from" TEXT,
    "vi_nat_op" TEXT,
    "va_nat_from" TEXT,
    "va_nat_op" TEXT,
    "vc_nat_from" TEXT,
    "vc_nat_op" TEXT,
    "param_vaca_decumul_from" TEXT,
    "param_vaca_partition_date" TEXT,
    "param_vaca_op" TEXT,
    "param_vacg_decumul_from" TEXT,
    "param_vacg_partition_date" TEXT,
    "param_vacg_op" TEXT,
    "poids_pourcent_dept" INTEGER,
    "poids_pourcent_reg" INTEGER,
    "poids_pourcent_nat" INTEGER,
    "tendance" TEXT,

    CONSTRAINT "metadata_parametrage_indicateurs_pkey" PRIMARY KEY ("indic_id")
);

-- CreateTable
CREATE TABLE "raw_data"."metadata_indicateurs_complementaire" (
    "indic_id" TEXT NOT NULL,
    "reforme_prioritaire" TEXT,
    "projet_annuel_perf" BOOLEAN,
    "detail_projet_annuel_perf" TEXT,
    "periodicite" TEXT,
    "delai_disponibilite" INTEGER,
    "indic_territorialise" BOOLEAN,
    "frequence_territoriale" TEXT,
    "mailles" TEXT,
    "admin_source" TEXT,
    "methode_collecte" TEXT,
    "si_source" TEXT,
    "donnee_ouverte" BOOLEAN,
    "modalites_donnee_ouverte" TEXT,
    "resp_donnees" TEXT,
    "resp_donnees_email" TEXT,
    "contact_technique" TEXT,
    "contact_technique_email" TEXT,
    "commentaire" TEXT,

    CONSTRAINT "metadata_indicateurs_complementaire_pkey" PRIMARY KEY ("indic_id")
);
