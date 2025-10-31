-- AddForeignKey
ALTER TABLE "public"."chantier_evaluation" ADD CONSTRAINT "chantier_evaluation_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."chantier_identite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
