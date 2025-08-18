-- DropForeignKey
ALTER TABLE "raw_data"."mesure_indicateur" DROP CONSTRAINT "mesure_indicateur_rapport_id_fkey";

-- AlterTable
ALTER TABLE "raw_data"."mesure_indicateur" ALTER COLUMN "rapport_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "raw_data"."mesure_indicateur" ADD CONSTRAINT "mesure_indicateur_rapport_id_fkey" FOREIGN KEY ("rapport_id") REFERENCES "public"."rapport_import_mesure_indicateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
