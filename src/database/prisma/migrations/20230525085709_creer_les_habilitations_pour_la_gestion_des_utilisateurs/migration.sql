-- AlterTable
ALTER TABLE "public"."profil"
ADD COLUMN "a_access_lecture_utilisateurs_pour_tous_les_chantiers" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "a_access_lecture_utilisateurs_pour_tous_les_territoires" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "a_access_modification_utilisateurs_pour_tous_les_chantiers" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "a_access_modification_utilisateurs_pour_tous_les_territoires" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "a_access_suppression_utilisateurs_pour_tous_les_chantiers" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "a_access_suppression_utilisateurs_pour_tous_les_territoires" BOOLEAN NOT NULL DEFAULT false;
-- Insert Data
UPDATE "public"."profil"
SET "a_access_lecture_utilisateurs_pour_tous_les_chantiers" = TRUE,
  "a_access_lecture_utilisateurs_pour_tous_les_territoires" = TRUE,
  "a_access_modification_utilisateurs_pour_tous_les_chantiers" = TRUE,
  "a_access_modification_utilisateurs_pour_tous_les_territoires" = TRUE,
  "a_access_suppression_utilisateurs_pour_tous_les_chantiers" = TRUE,
  "a_access_suppression_utilisateurs_pour_tous_les_territoires" = TRUE
WHERE code = 'DITP_ADMIN';