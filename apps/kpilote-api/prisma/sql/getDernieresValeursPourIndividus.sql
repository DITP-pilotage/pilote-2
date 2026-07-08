-- Dernière valeur connue pour chaque individu, sur un indicateur donné.
-- Utilisé par le calcul de valeur dérivée (somme niveau par niveau).
SELECT DISTINCT ON (individu_id)
  individu_id AS "individuId",
  date,
  valeur
FROM valeur_avancement
WHERE indicateur_id = $1
  AND individu_id = ANY($2)
ORDER BY individu_id, date DESC, id DESC;
