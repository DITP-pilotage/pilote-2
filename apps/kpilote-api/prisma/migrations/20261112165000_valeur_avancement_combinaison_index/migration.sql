-- Valeurs d'une combinaison : la suppression d'une modalité les compte, et la
-- clé étrangère `Restrict` de valeur_avancement les cherche à chaque
-- suppression de combinaison.
CREATE INDEX "valeur_avancement_combinaison_id_idx" ON "valeur_avancement"("combinaison_id");
