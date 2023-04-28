/*
  Warnings:

  - A unique constraint covering the columns `[utilisateurId,scopeCode]` on the table `habilitation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "habilitation_utilisateurId_scopeCode_key" ON "public"."habilitation"("utilisateurId", "scopeCode");
