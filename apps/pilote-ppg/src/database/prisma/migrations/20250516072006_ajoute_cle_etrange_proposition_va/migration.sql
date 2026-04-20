-- AddForeignKey
ALTER TABLE "public"."proposition_valeur_actuelle" ADD CONSTRAINT "proposition_valeur_actuelle_indic_id_territoire_code_fkey" FOREIGN KEY ("indic_id", "territoire_code") REFERENCES "public"."indicateur_territoire"("id", "territoire_code") ON DELETE CASCADE ON UPDATE CASCADE;
