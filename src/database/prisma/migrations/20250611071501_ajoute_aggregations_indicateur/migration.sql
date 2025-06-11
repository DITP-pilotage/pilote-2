-- AlterTable
ALTER TABLE "public"."indicateur_identite" ADD COLUMN     "maille_nat_agregee" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maille_reg_agregee" BOOLEAN NOT NULL DEFAULT false;
