-- AlterTable
ALTER TABLE "public"."profil"
ADD COLUMN "projets_structurants_lecture_meme_perimetres_que_chantiers" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "projets_structurants_lecture_meme_territoires_que_chantiers" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "projets_structurants_lecture_tous_perimetres" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "projets_structurants_lecture_tous_territoires" BOOLEAN NOT NULL DEFAULT false;
-- UpdateTable
UPDATE "public"."profil"
SET "projets_structurants_lecture_tous_perimetres" = TRUE,
  "projets_structurants_lecture_tous_territoires" = TRUE
WHERE "public"."profil"."code" IN (
    'DITP_ADMIN',
    'DITP_PILOTAGE',
    'PR',
    'PM_ET_CABINET',
    'CABINET_MTFP'
  );
UPDATE "public"."profil"
SET "projets_structurants_lecture_meme_perimetres_que_chantiers" = TRUE,
  "projets_structurants_lecture_tous_territoires" = TRUE
WHERE "public"."profil"."code" IN (
    'CABINET_MINISTERIEL',
    'DIR_ADMIN_CENTRALE',
    'SECRETARIAT_GENERAL',
    'EQUIPE_DIR_PROJET',
    'DIR_PROJET',
    'DROM'
  );
UPDATE "public"."profil"
SET "projets_structurants_lecture_tous_perimetres" = TRUE,
  "projets_structurants_lecture_meme_territoires_que_chantiers" = TRUE
WHERE "public"."profil"."code" IN (
    'REFERENT_REGION',
    'PREFET_REGION',
    'REFERENT_DEPARTEMENT',
    'PREFET_DEPARTEMENT'
  );
UPDATE "public"."profil"
SET "projets_structurants_lecture_meme_perimetres_que_chantiers" = TRUE,
  "projets_structurants_lecture_meme_territoires_que_chantiers" = TRUE
WHERE "public"."profil"."code" IN (
    'SERVICES_DECONCENTRES_REGION',
    'SERVICES_DECONCENTRES_DEPARTEMENT'
  );