-- CreateEnum
CREATE TYPE "public"."etape_evaluation_enum" AS ENUM ('AUTO_EVALUATION', 'CONSOLIDATION', 'CONTROLE_QUALITE', 'AJUSTEMENTS', 'CONTRE_PROPOSITION', 'CONTROLE_QUALITE_BIS', 'AJUSTEMENTS_BIS');

-- CreateTable
CREATE TABLE "public"."referentiel_critere" (
    "id" UUID NOT NULL,
    "libelle" TEXT NOT NULL,
    "descriptif" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referentiel_critere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referentiel_sous_critere" (
    "id" UUID NOT NULL,
    "libelle" TEXT NOT NULL,
    "descriptif" TEXT NOT NULL,
    "parent_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referentiel_sous_critere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referentiel_rattachement" (
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referentiel_rattachement_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "public"."referentiel_objectif" (
    "id" UUID NOT NULL,
    "libelle" TEXT NOT NULL,
    "descriptif" TEXT NOT NULL,
    "jalon" INTEGER NOT NULL,
    "rattachement_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referentiel_objectif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fiche_evaluation" (
    "id" UUID NOT NULL,
    "jalon" INTEGER NOT NULL,
    "etape_courante" "public"."etape_evaluation_enum" NOT NULL,
    "rattachement_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiche_evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."etape_evaluation" (
    "id" UUID NOT NULL,
    "fiche_evaluation_id" UUID NOT NULL,
    "type" "public"."etape_evaluation_enum" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etape_evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rattachement_utilisateur_etape_jalon" (
    "id" UUID NOT NULL,
    "etape" "public"."etape_evaluation_enum" NOT NULL,
    "jalon" INTEGER NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "rattachement_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rattachement_utilisateur_etape_jalon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."evaluation_objectif" (
    "id" UUID NOT NULL,
    "etape_evaluation_id" UUID NOT NULL,
    "objectif_id" UUID NOT NULL,
    "auteur_id" UUID NOT NULL,
    "note" INTEGER,
    "commentaire" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_objectif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."evaluation_sous_critere" (
    "id" UUID NOT NULL,
    "etape_evaluation_id" UUID NOT NULL,
    "sous_critere_id" UUID NOT NULL,
    "auteur_id" UUID NOT NULL,
    "note" INTEGER,
    "commentaire" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_sous_critere_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fiche_evaluation_rattachement_code_jalon_key" ON "public"."fiche_evaluation"("rattachement_code", "jalon");

-- CreateIndex
CREATE UNIQUE INDEX "etape_evaluation_fiche_evaluation_id_type_key" ON "public"."etape_evaluation"("fiche_evaluation_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "rattachement_utilisateur_etape_jalon_utilisateur_id_rattach_key" ON "public"."rattachement_utilisateur_etape_jalon"("utilisateur_id", "rattachement_code", "jalon", "etape");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_objectif_etape_evaluation_id_objectif_id_auteur__key" ON "public"."evaluation_objectif"("etape_evaluation_id", "objectif_id", "auteur_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_sous_critere_etape_evaluation_id_sous_critere_id_key" ON "public"."evaluation_sous_critere"("etape_evaluation_id", "sous_critere_id", "auteur_id");

-- AddForeignKey
ALTER TABLE "public"."referentiel_sous_critere" ADD CONSTRAINT "referentiel_sous_critere_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."referentiel_critere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referentiel_objectif" ADD CONSTRAINT "referentiel_objectif_rattachement_code_fkey" FOREIGN KEY ("rattachement_code") REFERENCES "public"."referentiel_rattachement"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fiche_evaluation" ADD CONSTRAINT "fiche_evaluation_rattachement_code_fkey" FOREIGN KEY ("rattachement_code") REFERENCES "public"."referentiel_rattachement"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."etape_evaluation" ADD CONSTRAINT "etape_evaluation_fiche_evaluation_id_fkey" FOREIGN KEY ("fiche_evaluation_id") REFERENCES "public"."fiche_evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rattachement_utilisateur_etape_jalon" ADD CONSTRAINT "rattachement_utilisateur_etape_jalon_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rattachement_utilisateur_etape_jalon" ADD CONSTRAINT "rattachement_utilisateur_etape_jalon_rattachement_code_fkey" FOREIGN KEY ("rattachement_code") REFERENCES "public"."referentiel_rattachement"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluation_objectif" ADD CONSTRAINT "evaluation_objectif_etape_evaluation_id_fkey" FOREIGN KEY ("etape_evaluation_id") REFERENCES "public"."etape_evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluation_objectif" ADD CONSTRAINT "evaluation_objectif_objectif_id_fkey" FOREIGN KEY ("objectif_id") REFERENCES "public"."referentiel_objectif"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluation_objectif" ADD CONSTRAINT "evaluation_objectif_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluation_sous_critere" ADD CONSTRAINT "evaluation_sous_critere_etape_evaluation_id_fkey" FOREIGN KEY ("etape_evaluation_id") REFERENCES "public"."etape_evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluation_sous_critere" ADD CONSTRAINT "evaluation_sous_critere_sous_critere_id_fkey" FOREIGN KEY ("sous_critere_id") REFERENCES "public"."referentiel_sous_critere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluation_sous_critere" ADD CONSTRAINT "evaluation_sous_critere_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
