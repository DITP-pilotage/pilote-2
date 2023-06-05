ALTER TABLE "public"."habilitation" RENAME COLUMN "utilisateurId" to "utilisateur_id";

ALTER TABLE "public"."habilitation" RENAME CONSTRAINT "habilitation_utilisateurId_fkey" TO "habilitation_utilisateur_id_fkey";

ALTER INDEX "public"."habilitation_utilisateurId_scope_code_key" RENAME TO "habilitation_utilisateur_id_scope_code_key";
