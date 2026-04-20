ALTER TABLE "public"."habilitation" RENAME COLUMN "scopeCode" to "scope_code";

ALTER TABLE "public"."habilitation" RENAME CONSTRAINT "habilitation_scopeCode_fkey" TO "habilitation_scope_code_fkey";

ALTER INDEX "public"."habilitation_utilisateurId_scopeCode_key" RENAME TO "habilitation_utilisateurId_scope_code_key";
