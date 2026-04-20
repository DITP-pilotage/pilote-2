-- CreateEnum
CREATE TYPE "public"."application_accessible" AS ENUM ('PILOTE', 'PILOTE_EVAL');

-- AlterTable
ALTER TABLE "public"."utilisateur" ADD COLUMN     "applications_accessibles" "public"."application_accessible"[];

UPDATE "public"."utilisateur" SET "applications_accessibles" = ARRAY['PILOTE']::"public"."application_accessible"[];
