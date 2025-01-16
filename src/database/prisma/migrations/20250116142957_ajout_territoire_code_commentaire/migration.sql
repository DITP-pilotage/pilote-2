-- AlterTable
ALTER TABLE "public"."commentaire" ADD COLUMN     "territoire_code" TEXT;

UPDATE "public"."commentaire" SET territoire_code = CONCAT(maille, '-', code_insee);

ALTER TABLE "public"."commentaire" ALTER COLUMN "territoire_code" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."commentaire" ADD CONSTRAINT "commentaire_chantier_id_territoire_code_fkey" FOREIGN KEY ("chantier_id", "territoire_code") REFERENCES "public"."chantier_territoire"("id", "territoire_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "public"."synthese_des_resultats" ADD COLUMN     "territoire_code" TEXT;

UPDATE "public"."synthese_des_resultats" SET territoire_code = CONCAT(maille, '-', code_insee);

ALTER TABLE "public"."synthese_des_resultats" ALTER COLUMN "territoire_code" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."synthese_des_resultats" ADD CONSTRAINT "synthese_des_resultats_chantier_id_territoire_code_fkey" FOREIGN KEY ("chantier_id", "territoire_code") REFERENCES "public"."chantier_territoire"("id", "territoire_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."objectif" ADD CONSTRAINT "objectif_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantier_identite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."decision_strategique" ADD CONSTRAINT "decision_strategique_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantier_identite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
