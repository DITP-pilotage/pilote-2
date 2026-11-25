-- Saisies tronquées (une par bucket) pour les individus donnés sur un indicateur.
-- Utilisé pour les séries de valeurs (saisies feuilles + combineLatest des séries dérivées).
-- En cas de plusieurs saisies dans le même bucket, on garde la plus récente
-- (date DESC, id DESC pour départager les saisies du même jour).
-- $3 = unité de troncature : 'day' | 'week' | 'month' | 'quarter' | 'year'.
-- $4 = combinaisons visées : la vide seule pour un indicateur sans axe, NULL pour
--      toutes (indicateur à axes). Une saisie par (individu, combinaison, bucket).
-- $5 = nombre de derniers buckets gardés par cellule, NULL pour tout l'historique.
--      Suffit aux lectures des derniers points : les N derniers points d'une série
--      dérivée ne dépendent que des N dernières saisies de chaque cellule.
-- @param $4:combinaisonIds?
-- @param {Int} $5:derniersPoints?
WITH tronquees AS (
  -- Une saisie par (individu, combinaison, bucket) : la plus récente du bucket.
  SELECT DISTINCT ON (individu_id, combinaison_id, date_trunc($3::text, date::timestamp))
    individu_id                           AS "individuId",
    combinaison_id                        AS "combinaisonId",
    date_trunc($3::text, date::timestamp) AS debut_bucket,
    date                                  AS "dateOrigine",
    valeur
  FROM valeur_avancement
  WHERE indicateur_id = $1
    AND individu_id = ANY($2)
    AND ($4::uuid[] IS NULL OR combinaison_id = ANY($4::uuid[]))
  ORDER BY individu_id, combinaison_id, date_trunc($3::text, date::timestamp), date DESC, id DESC
),
rangees AS (
  -- Rang 1 : le bucket le plus récent de la cellule.
  SELECT
    tronquees.*,
    row_number() OVER (
      PARTITION BY "individuId", "combinaisonId"
      ORDER BY debut_bucket DESC
    ) AS rang
  FROM tronquees
)
-- Le bucket reste un timestamp jusqu'ici : la fenêtre et le tri ne comparent pas
-- du texte, et `to_char` ne tourne que sur les lignes gardées.
SELECT
  "individuId",
  "combinaisonId",
  to_char(debut_bucket, 'YYYY-MM-DD') AS "bucket",
  "dateOrigine",
  valeur
FROM rangees
WHERE $5::int IS NULL OR rang <= $5::int
ORDER BY "individuId", "combinaisonId", debut_bucket;
