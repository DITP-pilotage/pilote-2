-- CreateTable
CREATE TABLE "public"."indicateur_territoire" (
    "id" TEXT NOT NULL,
    "maille" "public"."maille" NOT NULL,
    "territoire_code" TEXT NOT NULL,
    "code_insee" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "valeur_cible_mandat" DOUBLE PRECISION,
    "taux_avancement_mandat" DOUBLE PRECISION,
    "date_valeur_actuelle" DATE,
    "date_valeur_initiale" DATE,
    "valeur_actuelle" DOUBLE PRECISION,
    "valeur_initiale" DOUBLE PRECISION,
    "territoire_nom" TEXT,
    "date_valeur_cible_mandat" DATE,
    "est_applicable" BOOLEAN,
    "ponderation_zone_declaree" DOUBLE PRECISION,
    "ponderation_zone_reel" DOUBLE PRECISION,
    "est_a_jour" BOOLEAN,
    "prochaine_date_maj" DATE,
    "prochaine_date_maj_jours" INTEGER,
    "tendance" TEXT,
    "valeur_actuelle_proposition" DOUBLE PRECISION,
    "auteur_proposition" TEXT,
    "date_proposition" DATE,
    "motif_proposition" TEXT,
    "source_donnee_methode_calcul_proposition" TEXT,
    "taux_avancement_mandat_proposition" DOUBLE PRECISION,
    "prochaine_date_valeur_actuelle" DATE,
    "evolution_valeur_actuelle" JSONB,

    CONSTRAINT "indicateur_territoire_pkey" PRIMARY KEY ("id","territoire_code")
);

-- AddForeignKey
ALTER TABLE "public"."indicateur_territoire" ADD CONSTRAINT "indicateur_territoire_territoire_code_fkey" FOREIGN KEY ("territoire_code") REFERENCES "public"."territoire"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."indicateur_territoire" ADD CONSTRAINT "indicateur_territoire_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."indicateur_identite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."indicateur_territoire_jalon" ADD CONSTRAINT "indicateur_territoire_jalon_id_territoire_code_fkey" FOREIGN KEY ("id", "territoire_code") REFERENCES "public"."indicateur_territoire"("id", "territoire_code") ON DELETE CASCADE ON UPDATE CASCADE;
