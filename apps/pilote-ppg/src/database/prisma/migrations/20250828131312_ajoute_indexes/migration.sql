-- CreateIndex
CREATE INDEX "indicateur_identite_chantier_id_idx" ON "public"."indicateur_identite"("chantier_id");

-- CreateIndex
CREATE INDEX "indicateur_territoire_territoire_code_idx" ON "public"."indicateur_territoire"("territoire_code");

-- CreateIndex
CREATE INDEX "indicateur_territoire_chantier_id_idx" ON "public"."indicateur_territoire"("chantier_id");

-- CreateIndex
CREATE INDEX "indicateur_territoire_id_territoire_code_chantier_id_idx" ON "public"."indicateur_territoire"("id", "territoire_code", "chantier_id");

-- CreateIndex
CREATE INDEX "indicateur_territoire_jalon_id_territoire_code_idx" ON "public"."indicateur_territoire_jalon"("id", "territoire_code");

-- CreateIndex
CREATE INDEX "indicateur_territoire_jalon_jalon_idx" ON "public"."indicateur_territoire_jalon"("jalon");

-- CreateIndex
CREATE INDEX "indicateur_territoire_valeur_evenement_indic_id_territoire__idx" ON "public"."indicateur_territoire_valeur_evenement"("indic_id", "territoire_code", "type_valeur");

-- CreateIndex
CREATE INDEX "indicateur_territoire_valeur_evenement_date_creation_ordre_idx" ON "public"."indicateur_territoire_valeur_evenement"("date_creation", "ordre");
