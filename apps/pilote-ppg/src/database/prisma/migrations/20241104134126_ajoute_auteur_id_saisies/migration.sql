-- AlterTable
ALTER TABLE "public"."commentaire" ADD COLUMN     "auteur_id" UUID;
ALTER TABLE "public"."commentaire" ALTER COLUMN "auteur" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."decision_strategique" ADD COLUMN     "auteur_id" UUID;
ALTER TABLE "public"."decision_strategique" ALTER COLUMN "auteur" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."objectif" ADD COLUMN     "auteur_id" UUID;
ALTER TABLE "public"."objectif" ALTER COLUMN "auteur" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."synthese_des_resultats" ADD COLUMN     "auteur_id" UUID;

-- AlterTable
ALTER TABLE "public"."utilisateur" RENAME COLUMN "auteur_creation" TO "auteur_email_creation";
ALTER TABLE "public"."utilisateur" RENAME COLUMN "auteur_modification" TO "auteur_email_modification";
ALTER TABLE "public"."utilisateur" ALTER COLUMN "auteur_email_modification" DROP NOT NULL,
ALTER COLUMN "auteur_email_creation" DROP NOT NULL;
ALTER TABLE "public"."utilisateur" 
ADD COLUMN     "auteur_id_creation" UUID,
ADD COLUMN     "auteur_id_modification" UUID;

-- AddForeignKey
ALTER TABLE "public"."synthese_des_resultats" ADD CONSTRAINT "synthese_des_resultats_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commentaire" ADD CONSTRAINT "commentaire_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."objectif" ADD CONSTRAINT "objectif_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."decision_strategique" ADD CONSTRAINT "decision_strategique_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."utilisateur" ADD CONSTRAINT "utilisateur_auteur_id_modification_fkey" FOREIGN KEY ("auteur_id_modification") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."utilisateur" ADD CONSTRAINT "utilisateur_auteur_id_creation_fkey" FOREIGN KEY ("auteur_id_creation") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
