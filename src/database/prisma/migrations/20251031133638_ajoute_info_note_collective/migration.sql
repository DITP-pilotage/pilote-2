-- AlterTable
ALTER TABLE "public"."chantier_evaluation" ADD COLUMN     "jalon" INTEGER NOT NULL DEFAULT 2025;

-- AlterTable
ALTER TABLE "public"."indicateur_evaluation" ADD COLUMN     "jalon" INTEGER NOT NULL DEFAULT 2025;

-- AddForeignKey
ALTER TABLE "public"."chantier_evaluation" ADD CONSTRAINT "chantier_evaluation_territoire_code_jalon_fkey" FOREIGN KEY ("territoire_code", "jalon") REFERENCES "public"."fiche_evaluation"("rattachement_code", "jalon") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chantier_evaluation" ADD CONSTRAINT "chantier_evaluation_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."chantier_identite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
