-- AlterTable
ALTER TABLE "public"."utilisateur" ADD COLUMN     "date_derniere_connexion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date_desactivation_programee" TIMESTAMP(3),
ADD COLUMN     "date_deuxieme_relance_desactivation" TIMESTAMP(3),
ADD COLUMN     "date_premiere_relance_desactivation" TIMESTAMP(3);
