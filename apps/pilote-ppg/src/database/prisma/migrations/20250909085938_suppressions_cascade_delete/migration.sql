-- DropForeignKey
ALTER TABLE "public"."commentaire" DROP CONSTRAINT "commentaire_auteur_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."commentaire" DROP CONSTRAINT "commentaire_chantier_id_territoire_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."decision_strategique" DROP CONSTRAINT "decision_strategique_auteur_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."decision_strategique" DROP CONSTRAINT "decision_strategique_chantier_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."historisation_modification" DROP CONSTRAINT "historisation_modification_id_auteur_fkey";

-- DropForeignKey
ALTER TABLE "public"."objectif" DROP CONSTRAINT "objectif_auteur_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."objectif" DROP CONSTRAINT "objectif_chantier_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."proposition_valeur_actuelle" DROP CONSTRAINT "proposition_valeur_actuelle_id_auteur_modification_fkey";

-- DropForeignKey
ALTER TABLE "public"."proposition_valeur_actuelle" DROP CONSTRAINT "proposition_valeur_actuelle_indic_id_territoire_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."synthese_des_resultats" DROP CONSTRAINT "synthese_des_resultats_auteur_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."synthese_des_resultats" DROP CONSTRAINT "synthese_des_resultats_chantier_id_territoire_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."utilisateur" DROP CONSTRAINT "utilisateur_profil_code_fkey";

-- AddForeignKey
ALTER TABLE "public"."synthese_des_resultats" ADD CONSTRAINT "synthese_des_resultats_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."synthese_des_resultats" ADD CONSTRAINT "synthese_des_resultats_chantier_id_territoire_code_fkey" FOREIGN KEY ("chantier_id", "territoire_code") REFERENCES "public"."chantier_territoire"("id", "territoire_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commentaire" ADD CONSTRAINT "commentaire_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commentaire" ADD CONSTRAINT "commentaire_chantier_id_territoire_code_fkey" FOREIGN KEY ("chantier_id", "territoire_code") REFERENCES "public"."chantier_territoire"("id", "territoire_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."objectif" ADD CONSTRAINT "objectif_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."objectif" ADD CONSTRAINT "objectif_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantier_identite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."decision_strategique" ADD CONSTRAINT "decision_strategique_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."decision_strategique" ADD CONSTRAINT "decision_strategique_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantier_identite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."utilisateur" ADD CONSTRAINT "utilisateur_profil_code_fkey" FOREIGN KEY ("profil_code") REFERENCES "public"."profil"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historisation_modification" ADD CONSTRAINT "historisation_modification_id_auteur_fkey" FOREIGN KEY ("id_auteur") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposition_valeur_actuelle" ADD CONSTRAINT "proposition_valeur_actuelle_indic_id_territoire_code_fkey" FOREIGN KEY ("indic_id", "territoire_code") REFERENCES "public"."indicateur_territoire"("id", "territoire_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proposition_valeur_actuelle" ADD CONSTRAINT "proposition_valeur_actuelle_id_auteur_modification_fkey" FOREIGN KEY ("id_auteur_modification") REFERENCES "public"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
