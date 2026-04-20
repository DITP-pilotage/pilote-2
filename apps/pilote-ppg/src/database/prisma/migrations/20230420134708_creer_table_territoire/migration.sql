-- CreateEnum
CREATE TYPE "public"."maille" AS ENUM ('nat', 'dept', 'reg');

-- AlterTable
ALTER TABLE "public"."chantier" ADD COLUMN     "territoire_code" TEXT;

-- CreateTable
CREATE TABLE "public"."territoire" (
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nom_affiche" TEXT NOT NULL,
    "maille" "public"."maille" NOT NULL,
    "code_insee" TEXT NOT NULL,
    "trace_svg" TEXT NOT NULL,
    "code_parent" TEXT,

    CONSTRAINT "territoire_pkey" PRIMARY KEY ("code")
);

-- AddForeignKey
ALTER TABLE "public"."chantier" ADD CONSTRAINT "chantier_territoire_code_fkey" FOREIGN KEY ("territoire_code") REFERENCES "public"."territoire"("code") ON DELETE CASCADE ON UPDATE CASCADE;
