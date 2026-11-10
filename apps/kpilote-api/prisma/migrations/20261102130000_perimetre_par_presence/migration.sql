-- Cloisonnement (POC dimensions, révision M1″) : une permission est restreinte ssi
-- des lignes de périmètre existent ; elles sont supprimées avec la permission.

-- AlterTable
ALTER TABLE "indicateur_permission" DROP COLUMN "perimetre_restreint";

-- AddForeignKey
ALTER TABLE "indicateur_permission_perimetre" ADD CONSTRAINT "indicateur_permission_perimetre_principal_id_indicateur_id_fkey" FOREIGN KEY ("principal_id", "indicateur_id", "action") REFERENCES "indicateur_permission"("principal_id", "indicateur_id", "action") ON DELETE CASCADE ON UPDATE CASCADE;

