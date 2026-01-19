-- CreateEnum
CREATE TYPE "public"."type_groupe_metadata_indicateur" AS ENUM ('METADATA_INDICATEURS', 'METADATA_PARAMETRAGE_INDICATEURS', 'METADATA_INDICATEURS_COMPLEMENTAIRE');

-- CreateTable
CREATE TABLE "public"."metadata_indicateur" (
    "name" TEXT NOT NULL,
    "data_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "est_visible" BOOLEAN NOT NULL,
    "alias" TEXT NOT NULL,
    "est_editable" BOOLEAN NOT NULL,
    "validation_regex" TEXT NOT NULL,
    "validation_regex_error_message" TEXT,
    "edit_box_type" TEXT,
    "default_value" TEXT,
    "est_obligatoire" BOOLEAN NOT NULL,
    "doit_afficher_la_description" BOOLEAN NOT NULL,
    "groupe" "public"."type_groupe_metadata_indicateur" NOT NULL,
    "bloc_id" INTEGER,

    CONSTRAINT "metadata_indicateur_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "public"."metadata_indicateur_valeur_acceptee" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "metadata_indicateur_name" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "valeur" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "metadata_indicateur_valeur_acceptee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "metadata_indicateur_valeur_acceptee_metadata_indicateur_nam_key" ON "public"."metadata_indicateur_valeur_acceptee"("metadata_indicateur_name", "ordre");

-- AddForeignKey
ALTER TABLE "public"."metadata_indicateur_valeur_acceptee" ADD CONSTRAINT "metadata_indicateur_valeur_acceptee_metadata_indicateur_na_fkey" FOREIGN KEY ("metadata_indicateur_name") REFERENCES "public"."metadata_indicateur"("name") ON DELETE CASCADE ON UPDATE CASCADE;
