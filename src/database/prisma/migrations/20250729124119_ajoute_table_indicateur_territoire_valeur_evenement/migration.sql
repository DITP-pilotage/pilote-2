-- CreateEnum
CREATE TYPE "public"."type_evenement" AS ENUM ('VALEUR_CREE', 'VALEUR_MODIFIEE', 'VALEUR_HISTORISEE', 'PROPOSITION_VALEUR_CREE', 'PROPOSITION_VALEUR_MODIFIEE', 'PROPOSITION_VALEUR_SUPPRIMEE', 'PROPOSITION_VALEUR_REFUSEE', 'PROPOSITION_VALEUR_ACCUSEE_RECEPTION', 'PROPOSITION_VALEUR_ACCEPTEE', 'PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE', 'PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE', 'PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION');

-- CreateEnum
CREATE TYPE "public"."type_valeur" AS ENUM ('VALEUR_AVANCEMENT', 'VALEUR_CIBLE', 'VALEUR_INITIALE');

-- CreateTable
CREATE TABLE "public"."indicateur_territoire_valeur_evenement" (
    "id" UUID NOT NULL,
    "indic_id" TEXT NOT NULL,
    "territoire_code" TEXT NOT NULL,
    "type_evenement" "public"."type_evenement" NOT NULL,
    "type_valeur" "public"."type_valeur" NOT NULL,
    "date_valeur" DATE NOT NULL,
    "donnees_complementaires" JSONB NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,
    "id_auteur_modification" UUID NOT NULL,
    "correlation_id" UUID NOT NULL,

    CONSTRAINT "indicateur_territoire_valeur_evenement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."indicateur_territoire_valeur_evenement" ADD CONSTRAINT "indicateur_territoire_valeur_evenement_indic_id_territoire_fkey" FOREIGN KEY ("indic_id", "territoire_code") REFERENCES "public"."indicateur_territoire"("id", "territoire_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."indicateur_territoire_valeur_evenement" ADD CONSTRAINT "indicateur_territoire_valeur_evenement_id_auteur_modificat_fkey" FOREIGN KEY ("id_auteur_modification") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
