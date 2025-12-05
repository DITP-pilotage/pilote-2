-- DropForeignKey
ALTER TABLE "public"."chantier_evaluation" DROP CONSTRAINT "chantier_evaluation_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."chantier_evaluation" ADD CONSTRAINT "chantier_evaluation_id_territoire_code_jalon_fkey" FOREIGN KEY ("id", "territoire_code", "jalon") REFERENCES "public"."chantier_territoire_jalon"("id", "territoire_code", "jalon") ON DELETE CASCADE ON UPDATE CASCADE;
