ALTER TABLE "public"."utilisateur" RENAME COLUMN "profilCode" TO "profil_code";

ALTER TABLE "public"."utilisateur" RENAME CONSTRAINT "utilisateur_profilCode_fkey" TO "utilisateur_profil_code_fkey";
