-- AlterTable
ALTER TABLE "public"."historisation_modification" ADD COLUMN     "id_auteur" UUID,
ALTER COLUMN "utilisateur_nom" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."historisation_modification" ADD CONSTRAINT "historisation_modification_id_auteur_fkey" FOREIGN KEY ("id_auteur") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
