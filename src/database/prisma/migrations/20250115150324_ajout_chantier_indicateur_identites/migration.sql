-- CreateTable
CREATE TABLE "public"."chantier_identite" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "perimetre_ids" TEXT[],
    "directeurs_administration_centrale" TEXT[],
    "directions_administration_centrale" TEXT[],
    "ministeres" TEXT[],
    "ministeres_acronymes" TEXT[],
    "directeurs_projet" TEXT[],
    "axe" TEXT NOT NULL DEFAULT 'non renseigné',
    "ppg" TEXT NOT NULL DEFAULT 'non renseignée',
    "directeurs_projet_mails" TEXT[],
    "est_barometre" BOOLEAN,
    "est_territorialise" BOOLEAN,
    "ate" "public"."type_ate",
    "possede_taux_avancement_departemental" BOOLEAN,
    "possede_taux_avancement_regional" BOOLEAN,
    "possede_meteo_departemental" BOOLEAN,
    "possede_meteo_regional" BOOLEAN,
    "statut" "public"."type_statut" NOT NULL DEFAULT 'PUBLIE',
    "cible_attendue" BOOLEAN NOT NULL DEFAULT true,
    "a_supprimer" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "chantier_identite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chantier_territoire" (
    "id" TEXT NOT NULL,
    "territoire_code" TEXT NOT NULL,
    "code_insee" TEXT NOT NULL,
    "maille" "public"."maille" NOT NULL,
    "zone_id" TEXT NOT NULL,
    "taux_avancement_mandat" DOUBLE PRECISION,
    "date_taux_avancement_mandat" DATE,
    "territoire_nom" TEXT,
    "meteo" TEXT DEFAULT 'NON_RENSEIGNEE',
    "taux_avancement_mandat_valeur_precedente" DOUBLE PRECISION,
    "est_applicable" BOOLEAN,
    "responsables_locaux" TEXT[],
    "coordinateurs_territoriaux" TEXT[],
    "responsables_locaux_mails" TEXT[],
    "coordinateurs_territoriaux_mails" TEXT[],
    "derniere_maj_date_qualitative" DATE,
    "tendance" "public"."type_tendance",
    "tendance_int_index" DOUBLE PRECISION,
    "ecart" DOUBLE PRECISION,
    "meteo_int_index" DOUBLE PRECISION,
    "donnees_maille_source" "public"."maille",

    CONSTRAINT "chantier_territoire_pkey" PRIMARY KEY ("id","territoire_code")
);

-- CreateTable
CREATE TABLE "public"."chantier_territoire_jalon" (
    "id" TEXT NOT NULL,
    "code_insee" TEXT NOT NULL,
    "maille" "public"."maille" NOT NULL,
    "territoire_code" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "jalon" INTEGER NOT NULL,
    "taux_avancement" DOUBLE PRECISION,

    CONSTRAINT "chantier_territoire_jalon_pkey" PRIMARY KEY ("id","territoire_code", "jalon")
);

-- CreateTable
CREATE TABLE "public"."indicateur_identite" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "chantier_id" TEXT NOT NULL,
    "type_id" TEXT,
    "type_nom" TEXT,
    "est_barometre" BOOLEAN,
    "est_phare" BOOLEAN,
    "description" TEXT,
    "source" TEXT,
    "mode_de_calcul" TEXT,
    "unite_mesure" TEXT,
    "a_supprimer" BOOLEAN NOT NULL DEFAULT true,
    "dernier_import_date_indic" DATE,
    "periodicite" TEXT,
    "delai_disponibilite" INTEGER,
    "parent_id" TEXT,
    "responsables_donnees_mails" TEXT[],

    CONSTRAINT "indicateur_identite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."indicateur_territoire" (
    "id" TEXT NOT NULL,
    "valeur_cible_mandat" DOUBLE PRECISION,
    "taux_avancement_mandat" DOUBLE PRECISION,
    "date_valeur_cible_mandat" DATE,
    "valeur_initiale" DOUBLE PRECISION,
    "date_valeur_initiale" DATE,
    "valeur_actuelle" DOUBLE PRECISION,
    "date_valeur_actuelle" DATE,
    "territoire_nom" TEXT,
    "code_insee" TEXT NOT NULL,
    "maille" TEXT NOT NULL,
    "evolution_valeur_actuelle" JSONB,
    "territoire_code" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "ponderation_zone_declaree" DOUBLE PRECISION,
    "ponderation_zone_reel" DOUBLE PRECISION,
    "est_applicable" BOOLEAN,
    "prochaine_date_maj" DATE,
    "prochaine_date_maj_jours" INTEGER,
    "prochaine_date_valeur_actuelle" DATE,
    "est_a_jour" BOOLEAN,
    "tendance" TEXT,
    "valeur_actuelle_proposition" DOUBLE PRECISION,
    "taux_avancement_mandat_proposition" DOUBLE PRECISION,
    "date_proposition" DATE,
    "motif_proposition" TEXT,
    "source_donnee_methode_calcul_proposition" TEXT,
    "auteur_proposition" TEXT,

    CONSTRAINT "indicateur_territoire_pkey" PRIMARY KEY ("id","territoire_code")
);

-- CreateTable
CREATE TABLE "public"."indicateur_territoire_jalon" (
    "id" TEXT NOT NULL,
    "territoire_code" TEXT NOT NULL,
    "code_insee" TEXT NOT NULL,
    "maille" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "jalon" TEXT NOT NULL,
    "date_valeur_cible" DATE,
    "valeur_cible" DOUBLE PRECISION,
    "taux_avancement" DOUBLE PRECISION,
    "taux_avancement_proposition" DOUBLE PRECISION,

    CONSTRAINT "indicateur_territoire_jalon_pkey" PRIMARY KEY ("id","territoire_code","jalon")
);

-- AddForeignKey
ALTER TABLE "public"."chantier_territoire" ADD CONSTRAINT "chantier_territoire_territoire_code_fkey" FOREIGN KEY ("territoire_code") REFERENCES "public"."territoire"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chantier_territoire" ADD CONSTRAINT "chantier_territoire_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."chantier_identite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chantier_territoire_jalon" ADD CONSTRAINT "chantier_territoire_jalon_id_territoire_code_fkey" FOREIGN KEY ("id", "territoire_code") REFERENCES "public"."chantier_territoire"("id", "territoire_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."indicateur_territoire" ADD CONSTRAINT "indicateur_territoire_territoire_code_fkey" FOREIGN KEY ("territoire_code") REFERENCES "public"."territoire"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."indicateur_territoire" ADD CONSTRAINT "indicateur_territoire_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."indicateur_identite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."indicateur_territoire_jalon" ADD CONSTRAINT "indicateur_territoire_jalon_id_territoire_code_fkey" FOREIGN KEY ("id", "territoire_code") REFERENCES "public"."indicateur_territoire"("id", "territoire_code") ON DELETE CASCADE ON UPDATE CASCADE;
