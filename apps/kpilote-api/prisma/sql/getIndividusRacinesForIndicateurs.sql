-- Individu racine de chaque indicateur donné : parmi les individus de tous ses
-- référentiels liés, ceux qui n'ont aucun parent dans ces mêmes référentiels
-- (France au-dessus des régions et des départements). Plusieurs racines : la
-- première par nom, puis par public_id pour départager deux noms identiques.
-- La racine ne dépend que de l'ensemble des référentiels liés : on la calcule
-- une fois par ensemble distinct, puis on la reporte sur chaque indicateur.
-- Un indicateur sans référentiel lié, ou sans individu, n'a pas de ligne.
WITH ensembles AS (
  SELECT indicateur_id, array_agg(referentiel_id ORDER BY referentiel_id) AS referentiels
  FROM indicateur_referentiel
  WHERE indicateur_id = ANY($1::uuid[])
  GROUP BY indicateur_id
),
racines AS (
  SELECT DISTINCT ON (ensemble.referentiels)
    ensemble.referentiels,
    individu.id,
    individu.public_id,
    individu.referentiel_id
  FROM (SELECT DISTINCT referentiels FROM ensembles) AS ensemble
  JOIN individu ON individu.referentiel_id = ANY(ensemble.referentiels)
  WHERE NOT EXISTS (
    SELECT 1
    FROM relation
    JOIN individu AS parent ON parent.id = relation.parent_id
    WHERE relation.child_id = individu.id
      AND parent.referentiel_id = ANY(ensemble.referentiels)
  )
  ORDER BY ensemble.referentiels, individu.nom, individu.public_id
)
SELECT
  ensembles.indicateur_id   AS "indicateurId",
  racines.id                AS "id",
  racines.public_id         AS "publicId",
  racines.referentiel_id    AS "referentielId"
FROM ensembles
JOIN racines ON racines.referentiels = ensembles.referentiels;
