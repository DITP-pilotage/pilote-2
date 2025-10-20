/*
  Warnings:

  - The values [CONTROLE_QUALITE,AJUSTEMENTS,CONTRE_PROPOSITION,CONTROLE_QUALITE_BIS,AJUSTEMENTS_BIS] on the enum `etape_evaluation_enum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."etape_evaluation_enum_new" AS ENUM ('AUTO_EVALUATION', 'CONSOLIDATION', 'INSTRUCTION');
ALTER TABLE "public"."fiche_evaluation" ALTER COLUMN "etape_courante" TYPE "public"."etape_evaluation_enum_new" USING ("etape_courante"::text::"public"."etape_evaluation_enum_new");
ALTER TABLE "public"."etape_evaluation" ALTER COLUMN "type" TYPE "public"."etape_evaluation_enum_new" USING ("type"::text::"public"."etape_evaluation_enum_new");
ALTER TABLE "public"."rattachement_utilisateur_etape_jalon" ALTER COLUMN "etape" TYPE "public"."etape_evaluation_enum_new" USING ("etape"::text::"public"."etape_evaluation_enum_new");
ALTER TYPE "public"."etape_evaluation_enum" RENAME TO "etape_evaluation_enum_old";
ALTER TYPE "public"."etape_evaluation_enum_new" RENAME TO "etape_evaluation_enum";
DROP TYPE "public"."etape_evaluation_enum_old";
COMMIT;
