-- Retire l'ancienne clé d'une valeur (indicateur, individu, date), qui interdisait
-- plusieurs combinaisons pour un même individu (PIL-1989). La clé est désormais
-- (indicateur, individu, combinaison, date).
DROP INDEX "valeur_avancement_indicateur_id_individu_id_date_key";
