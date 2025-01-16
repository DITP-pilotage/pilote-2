/*
  Warnings:

  - The primary key for the `chantier_territoire_jalon` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `maille` on the `chantier_territoire` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `zone_id` to the `chantier_territoire_jalon` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `maille` on the `chantier_territoire_jalon` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `jalon` on the `chantier_territoire_jalon` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."chantier_identite" ALTER COLUMN "axe" SET DEFAULT 'non renseigné';

-- AlterTable
ALTER TABLE "public"."chantier_territoire" DROP COLUMN "maille",
ADD COLUMN     "maille" "public"."maille" NOT NULL;

-- AlterTable
ALTER TABLE "public"."chantier_territoire_jalon" DROP CONSTRAINT "chantier_territoire_jalon_pkey",
ADD COLUMN     "zone_id" TEXT NOT NULL,
DROP COLUMN "maille",
ADD COLUMN     "maille" "public"."maille" NOT NULL,
DROP COLUMN "jalon",
ADD COLUMN     "jalon" INTEGER NOT NULL,
ADD CONSTRAINT "chantier_territoire_jalon_pkey" PRIMARY KEY ("id", "territoire_code", "jalon");
