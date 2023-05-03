-- AlterTable
ALTER TABLE "public"."profil" ADD COLUMN     "a_acces_tous_les_territoires_lecture" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "a_acces_tous_les_territoires_saisie_commentaire" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "a_acces_tous_les_territoires_saisie_indicateur" BOOLEAN NOT NULL DEFAULT false;
