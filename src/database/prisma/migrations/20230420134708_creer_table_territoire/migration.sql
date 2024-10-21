-- CreateEnum
CREATE TYPE "public"."maille" AS ENUM ('nat', 'dept', 'reg'); -- TODO: que faire avec ça ?

-- AlterTable
ALTER TABLE "public"."chantier" ADD COLUMN     "territoire_code" TEXT;

CREATE TABLE public.territoire (
	code text NOT NULL,
	nom text NOT NULL,
	nom_affiche text NOT NULL,
	"maille" public."maille" NOT NULL,
	code_insee text NOT NULL,
	code_parent text NULL,
	zone_id text NOT NULL,
	CONSTRAINT territoire_pkey PRIMARY KEY (code)
);

-- AddForeignKey
ALTER TABLE "public"."chantier" ADD CONSTRAINT "chantier_territoire_code_fkey" FOREIGN KEY ("territoire_code") REFERENCES "public"."territoire"("code") ON DELETE CASCADE ON UPDATE CASCADE;
