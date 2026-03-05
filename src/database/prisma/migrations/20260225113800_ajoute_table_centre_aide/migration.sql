-- CreateEnum
CREATE TYPE "public"."TypeArticleCentreAide" AS ENUM ('GROUPE', 'PAGE');

-- CreateTable
CREATE TABLE "public"."article_centre_aide" (
    "id" UUID NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT,
    "type" "public"."TypeArticleCentreAide" NOT NULL,
    "ordre" INTEGER NOT NULL,
    "parent_id" UUID,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_centre_aide_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."article_centre_aide" ADD CONSTRAINT "article_centre_aide_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."article_centre_aide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
