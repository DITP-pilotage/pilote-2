-- CreateTable
CREATE TABLE "public"."indicateur_territoire_jalon" (
    "id" TEXT NOT NULL,
    "territoire_code" TEXT NOT NULL,
    "code_insee" TEXT NOT NULL,
    "maille" "public"."maille" NOT NULL,
    "jalon" INTEGER NOT NULL,
    "zone_id" TEXT NOT NULL,
    "date_valeur_cible" DATE,
    "taux_avancement" DOUBLE PRECISION,
    "valeur_cible" DOUBLE PRECISION,
    "taux_avancement_proposition" DOUBLE PRECISION,

    CONSTRAINT "indicateur_territoire_jalon_pkey" PRIMARY KEY ("id","territoire_code","jalon")
);

-- AddForeignKey
ALTER TABLE "public"."indicateur_territoire_jalon" ADD CONSTRAINT "indicateur_territoire_jalon_id_territoire_code_fkey" FOREIGN KEY ("id", "territoire_code") REFERENCES "public"."indicateur_territoire"("id", "territoire_code") ON DELETE CASCADE ON UPDATE CASCADE;
