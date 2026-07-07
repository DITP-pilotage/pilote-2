-- CreateIndex
CREATE INDEX "commentaire_chantier_id_territoire_code_statut_idx" ON "public"."commentaire"("chantier_id", "territoire_code", "statut");

-- CreateIndex
CREATE INDEX "synthese_des_resultats_chantier_id_territoire_code_statut_idx" ON "public"."synthese_des_resultats"("chantier_id", "territoire_code", "statut");

-- CreateIndex
CREATE INDEX "objectif_chantier_id_statut_idx" ON "public"."objectif"("chantier_id", "statut");

-- CreateIndex
CREATE INDEX "decision_strategique_chantier_id_statut_idx" ON "public"."decision_strategique"("chantier_id", "statut");
