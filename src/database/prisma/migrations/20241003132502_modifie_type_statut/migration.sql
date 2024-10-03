/*
  Warnings:

  - The values [NON_PUBLIE] on the enum `type_statut` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."type_statut_new" AS ENUM ('BROUILLON', 'PUBLIE', 'ARCHIVE', 'SUPPRIME');
ALTER TABLE "public"."chantier" ALTER COLUMN "statut" DROP DEFAULT;
ALTER TABLE "public"."chantier" ALTER COLUMN "statut" TYPE "public"."type_statut_new" USING ("statut"::text::"public"."type_statut_new");
ALTER TYPE "public"."type_statut" RENAME TO "type_statut_old";
ALTER TYPE "public"."type_statut_new" RENAME TO "type_statut";
DROP TYPE "public"."type_statut_old";
ALTER TABLE "public"."chantier" ALTER COLUMN "statut" SET DEFAULT 'PUBLIE';
COMMIT;
