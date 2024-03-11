-- AlterTable
ALTER TABLE "public"."utilisateur" ADD COLUMN     "auteur_creation" TEXT,
ADD COLUMN     "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "auteur_modification" DROP NOT NULL,
ALTER COLUMN "date_modification" DROP NOT NULL,
ALTER COLUMN "date_modification" DROP DEFAULT;
