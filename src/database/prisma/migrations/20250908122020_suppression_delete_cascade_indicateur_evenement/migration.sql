-- DropForeignKey
ALTER TABLE "public"."indicateur_territoire_valeur_evenement" DROP CONSTRAINT "indicateur_territoire_valeur_evenement_id_auteur_modificat_fkey";

-- DropForeignKey
ALTER TABLE "public"."indicateur_territoire_valeur_evenement" DROP CONSTRAINT "indicateur_territoire_valeur_evenement_indic_id_territoire_fkey";

-- AddForeignKey
ALTER TABLE "public"."indicateur_territoire_valeur_evenement" ADD CONSTRAINT "indicateur_territoire_valeur_evenement_indic_id_territoire_fkey" FOREIGN KEY ("indic_id", "territoire_code") REFERENCES "public"."indicateur_territoire"("id", "territoire_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."indicateur_territoire_valeur_evenement" ADD CONSTRAINT "indicateur_territoire_valeur_evenement_id_auteur_modificat_fkey" FOREIGN KEY ("id_auteur_modification") REFERENCES "public"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
