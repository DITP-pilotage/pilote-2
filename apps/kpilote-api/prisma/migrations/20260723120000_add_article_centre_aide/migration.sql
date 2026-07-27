-- CreateEnum
CREATE TYPE "article_centre_aide_type_enum" AS ENUM ('GROUPE', 'PAGE');

-- CreateTable
CREATE TABLE "article_centre_aide" (
    "id" UUID NOT NULL,
    "type" "article_centre_aide_type_enum" NOT NULL,
    "parent_id" UUID,
    "ordre" INTEGER NOT NULL,
    "est_publie" BOOLEAN NOT NULL DEFAULT false,
    "est_masque" BOOLEAN NOT NULL DEFAULT false,
    "titre" TEXT NOT NULL DEFAULT '',
    "titre_affiche" TEXT NOT NULL DEFAULT '',
    "contenu" TEXT NOT NULL DEFAULT '',
    "contenu_texte" TEXT NOT NULL DEFAULT '',
    "titre_brouillon" TEXT NOT NULL DEFAULT '',
    "titre_affiche_brouillon" TEXT NOT NULL DEFAULT '',
    "contenu_brouillon" TEXT NOT NULL DEFAULT '',
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_centre_aide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_centre_aide_parent_id_idx" ON "article_centre_aide"("parent_id");

-- CreateIndex
CREATE INDEX "article_centre_aide_created_by_idx" ON "article_centre_aide"("created_by");

-- CreateIndex
CREATE INDEX "article_centre_aide_updated_by_idx" ON "article_centre_aide"("updated_by");

-- AddForeignKey
ALTER TABLE "article_centre_aide" ADD CONSTRAINT "article_centre_aide_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "article_centre_aide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_centre_aide" ADD CONSTRAINT "article_centre_aide_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_centre_aide" ADD CONSTRAINT "article_centre_aide_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
