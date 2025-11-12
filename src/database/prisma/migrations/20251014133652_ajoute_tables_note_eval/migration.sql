-- AlterTable
ALTER TABLE "public"."indicateur_territoire" ADD COLUMN     "ponderation_zone_declaree_eval" DOUBLE PRECISION,
ADD COLUMN     "ponderation_zone_reel_eval" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."chantier_evaluation" (
    "id" TEXT NOT NULL,
    "code_insee" TEXT NOT NULL,
    "maille" "public"."maille" NOT NULL,
    "territoire_code" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "taux_avancement" DOUBLE PRECISION,
    "date_calcul" DATE NOT NULL,

    CONSTRAINT "chantier_evaluation_pkey" PRIMARY KEY ("id","territoire_code","date_calcul")
);

-- CreateTable
CREATE TABLE "public"."indicateur_evaluation" (
    "id" TEXT NOT NULL,
    "chantier_id" TEXT NOT NULL,
    "territoire_code" TEXT NOT NULL,
    "code_insee" TEXT NOT NULL,
    "maille" "public"."maille" NOT NULL,
    "zone_id" TEXT NOT NULL,
    "taux_avancement" DOUBLE PRECISION,
    "ponderation_declaree" DOUBLE PRECISION NOT NULL,
    "ponderation_reelle" DOUBLE PRECISION NOT NULL,
    "date_calcul" DATE NOT NULL,

    CONSTRAINT "indicateur_evaluation_pkey" PRIMARY KEY ("id","territoire_code","date_calcul")
);
