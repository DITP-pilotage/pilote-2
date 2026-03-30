-- AlterTable
ALTER TABLE "public"."article_centre_aide" ADD COLUMN "titre_brouillon" TEXT;
ALTER TABLE "public"."article_centre_aide" ADD COLUMN "contenu_brouillon" TEXT;
ALTER TABLE "public"."article_centre_aide" ADD COLUMN "est_publie" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."article_centre_aide" ADD COLUMN "est_masque" BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing data: copy current content to draft fields and mark as published
UPDATE "public"."article_centre_aide" SET "titre_brouillon" = "titre", "contenu_brouillon" = "contenu", "est_publie" = true;
