ALTER TABLE "public"."rapport_import_mesure_indicateur" RENAME COLUMN "utilisateurEmail" TO "utilisateur_email";

ALTER TABLE "public"."rapport_import_mesure_indicateur" RENAME CONSTRAINT "rapport_import_mesure_indicateur_utilisateurEmail_fkey" TO "rapport_import_mesure_indicateur_utilisateur_email_fkey";
