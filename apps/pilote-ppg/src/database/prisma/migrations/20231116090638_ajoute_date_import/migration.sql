-- AlterTable
ALTER TABLE "public"."indicateur" ADD COLUMN     "dernier_import_auteur" TEXT,
ADD COLUMN     "dernier_import_auteur_indic" TEXT,
ADD COLUMN     "dernier_import_date" DATE,
ADD COLUMN     "dernier_import_date_indic" DATE,
ADD COLUMN     "dernier_import_rapport_id" UUID,
ADD COLUMN     "dernier_import_rapport_id_indic" UUID;
