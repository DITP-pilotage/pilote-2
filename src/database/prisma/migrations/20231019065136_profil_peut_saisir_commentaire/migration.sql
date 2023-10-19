-- AlterTable
ALTER TABLE "public"."profil" ADD COLUMN     "peut_saisir_des_commentaires" BOOLEAN NOT NULL DEFAULT false;
-- UpdateTable
UPDATE "public"."profil"
SET "peut_saisir_des_commentaires" = TRUE
WHERE "public"."profil"."code" IN (
    'DITP_ADMIN',
    'DITP_PILOTAGE',
    'SECRETARIAT_GENERAL',
    'EQUIPE_DIR_PROJET',
    'DIR_PROJET',
    'REFERENT_REGION',
    'PREFET_REGION',
    'SERVICES_DECONCENTRES_REGION',
    'REFERENT_DEPARTEMENT',
    'PREFET_DEPARTEMENT',
    'SERVICES_DECONCENTRES_DEPARTEMENT',
    'DROM',
    'RESPONSABLE_REGION',
    'RESPONSABLE_DEPARTEMENT'
  );

