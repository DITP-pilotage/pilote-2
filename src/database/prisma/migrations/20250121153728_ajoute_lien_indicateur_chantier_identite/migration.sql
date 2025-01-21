-- AddForeignKey
ALTER TABLE "public"."indicateur_identite" ADD CONSTRAINT "indicateur_identite_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantier_identite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
