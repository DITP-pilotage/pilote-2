/*
 Warnings:
 
 - You are about to drop the column `a_access_lecture_utilisateurs_pour_tous_les_chantiers` on the `profil` table. All the data in the column will be lost.
 - You are about to drop the column `a_access_lecture_utilisateurs_pour_tous_les_territoires` on the `profil` table. All the data in the column will be lost.
 - You are about to drop the column `a_access_modification_utilisateurs_pour_tous_les_chantiers` on the `profil` table. All the data in the column will be lost.
 - You are about to drop the column `a_access_modification_utilisateurs_pour_tous_les_territoires` on the `profil` table. All the data in the column will be lost.
 - You are about to drop the column `a_access_suppression_utilisateurs_pour_tous_les_chantiers` on the `profil` table. All the data in the column will be lost.
 - You are about to drop the column `a_access_suppression_utilisateurs_pour_tous_les_territoires` on the `profil` table. All the data in the column will be lost.
 
 */
-- AlterTable
ALTER TABLE "public"."profil" DROP COLUMN "a_access_lecture_utilisateurs_pour_tous_les_chantiers",
  DROP COLUMN "a_access_lecture_utilisateurs_pour_tous_les_territoires",
  DROP COLUMN "a_access_modification_utilisateurs_pour_tous_les_chantiers",
  DROP COLUMN "a_access_modification_utilisateurs_pour_tous_les_territoires",
  DROP COLUMN "a_access_suppression_utilisateurs_pour_tous_les_chantiers",
  DROP COLUMN "a_access_suppression_utilisateurs_pour_tous_les_territoires",
  ADD COLUMN "peut_consulter_les_utilisateurs" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "peut_modifier_les_utilisateurs" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "peut_supprimer_les_utilisateurs" BOOLEAN NOT NULL DEFAULT false;
-- UpdateTable
UPDATE "public"."profil"
SET "peut_consulter_les_utilisateurs" = TRUE,
  "peut_modifier_les_utilisateurs" = TRUE,
  "peut_supprimer_les_utilisateurs" = TRUE
WHERE "public"."profil"."code" = 'DITP_ADMIN';