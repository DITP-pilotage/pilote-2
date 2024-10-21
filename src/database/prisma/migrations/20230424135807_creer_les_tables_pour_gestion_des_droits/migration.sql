/*
 Warnings:
 
 - The primary key for the `chantier` table will be changed. If it partially fails, the table could be left without primary key constraint.
 - The primary key for the `profil` table will be changed. If it partially fails, the table could be left without primary key constraint.
 - You are about to drop the column `id` on the `profil` table. All the data in the column will be lost.
 - You are about to drop the column `profil_id` on the `utilisateur` table. All the data in the column will be lost.
 - You are about to drop the `habilitation_scope` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `profil_habilitation` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `utilisateur_chantier` table. If the table is not empty, all the data it contains will be lost.
 - Added the required column `profilCode` to the `utilisateur` table without a default value. This is not possible if the table is not empty.
 
 */
-- AlterTable
ALTER TABLE "public"."chantier" DROP CONSTRAINT "chantier_pkey",
  ADD CONSTRAINT "chantier_pkey" PRIMARY KEY ("id", "code_insee", "maille");
-- AlterTable
ALTER TABLE "public"."utilisateur" DROP COLUMN "profil_id",
  ADD COLUMN "profilCode" TEXT NOT NULL;
-- DropTable
DROP TABLE "public"."habilitation_scope";
-- DropTable
DROP TABLE "public"."profil_habilitation";
-- DropTable
DROP TABLE "public"."utilisateur_chantier";
-- CreateTable
CREATE TABLE "public"."habilitation" (
  "utilisateurId" UUID NOT NULL,
  "scopeCode" TEXT NOT NULL,
  "territoires" TEXT [],
  "perimetres" TEXT [],
  "chantiers" TEXT []
);



CREATE TABLE public."scope" (
	code text NOT NULL,
	nom text NOT NULL,
	CONSTRAINT scope_pkey PRIMARY KEY (code)
);

CREATE TABLE public.profil (
	code text NOT NULL,
	nom text NOT NULL,
	a_acces_tous_chantiers bool NOT NULL DEFAULT false,
	a_acces_tous_chantiers_territorialises bool NOT NULL DEFAULT false,
	a_acces_tous_les_territoires_lecture bool NOT NULL DEFAULT false,
	a_acces_tous_les_territoires_saisie_commentaire bool NOT NULL DEFAULT false,
	a_acces_tous_les_territoires_saisie_indicateur bool NOT NULL DEFAULT false,
	peut_modifier_les_utilisateurs bool NOT NULL DEFAULT false,
	projets_structurants_lecture_meme_perimetres_que_chantiers bool NOT NULL DEFAULT false,
	projets_structurants_lecture_meme_territoires_que_chantiers bool NOT NULL DEFAULT false,
	projets_structurants_lecture_tous_perimetres bool NOT NULL DEFAULT false,
	projets_structurants_lecture_tous_territoires bool NOT NULL DEFAULT false,
	peut_saisir_des_commentaires bool NOT NULL DEFAULT false,
	a_access_aux_chantiers_brouillons bool NOT NULL DEFAULT false,
	a_acces_a_tous_les_chantiers_utilisateurs bool NOT NULL DEFAULT false,
	a_acces_a_tous_les_territoires_utilisateurs bool NOT NULL DEFAULT false,
	CONSTRAINT profil_pkey PRIMARY KEY (code)
);

-- AddForeignKey
ALTER TABLE "public"."utilisateur"
ADD CONSTRAINT "utilisateur_profilCode_fkey" FOREIGN KEY ("profilCode") REFERENCES "public"."profil"("code") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "public"."habilitation"
ADD CONSTRAINT "habilitation_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "public"."habilitation"
ADD CONSTRAINT "habilitation_scopeCode_fkey" FOREIGN KEY ("scopeCode") REFERENCES "public"."scope"("code") ON DELETE CASCADE ON UPDATE CASCADE; -- pb à venir si suppr table scope ?
