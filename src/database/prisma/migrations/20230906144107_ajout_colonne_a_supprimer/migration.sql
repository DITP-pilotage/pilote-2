-- AlterTable
ALTER TABLE "public"."axe" ADD COLUMN     "a_supprimer" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."chantier" ADD COLUMN     "a_supprimer" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."indicateur" ADD COLUMN     "a_supprimer" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."indicateur_projet_structurant" ADD COLUMN     "a_supprimer" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."ministere" ADD COLUMN     "a_supprimer" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."perimetre" ADD COLUMN     "a_supprimer" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."perimetre_projet_structurant" ADD COLUMN     "a_supprimer" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."ppg" ADD COLUMN     "a_supprimer" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."projet_structurant" ADD COLUMN     "a_supprimer" BOOLEAN NOT NULL DEFAULT true;
