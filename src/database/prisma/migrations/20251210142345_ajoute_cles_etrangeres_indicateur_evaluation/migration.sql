/*
  Warnings:

  - The primary key for the `chantier_evaluation` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "public"."chantier_evaluation" DROP CONSTRAINT "chantier_evaluation_pkey",
ADD CONSTRAINT "chantier_evaluation_pkey" PRIMARY KEY ("id", "territoire_code", "jalon", "date_calcul");

-- AddForeignKey
ALTER TABLE "public"."indicateur_evaluation" ADD CONSTRAINT "indicateur_evaluation_chantier_id_territoire_code_date_cal_fkey" FOREIGN KEY ("chantier_id", "territoire_code", "date_calcul", "jalon") REFERENCES "public"."chantier_evaluation"("id", "territoire_code", "date_calcul", "jalon") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."indicateur_evaluation" ADD CONSTRAINT "indicateur_evaluation_id_territoire_code_jalon_fkey" FOREIGN KEY ("id", "territoire_code", "jalon") REFERENCES "public"."indicateur_territoire_jalon"("id", "territoire_code", "jalon") ON DELETE CASCADE ON UPDATE CASCADE;
