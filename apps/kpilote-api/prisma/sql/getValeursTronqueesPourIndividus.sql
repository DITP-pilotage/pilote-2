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
SELECT "individuId", "combinaisonId", "bucket", "dateOrigine", valeur
FROM (
  SELECT
    tronquees.*,
    row_number() OVER (
      PARTITION BY "individuId", "combinaisonId"
      ORDER BY "bucket" DESC
    ) AS rang
  FROM (
    SELECT DISTINCT ON (individu_id, combinaison_id, date_trunc($3::text, date::timestamp))
      individu_id                                                       AS "individuId",
      combinaison_id                                                    AS "combinaisonId",
      to_char(date_trunc($3::text, date::timestamp), 'YYYY-MM-DD')      AS "bucket",
      date                                                              AS "dateOrigine",
      valeur
    FROM valeur_avancement
    WHERE indicateur_id = $1
      AND individu_id = ANY($2)
      AND ($4::uuid[] IS NULL OR combinaison_id = ANY($4::uuid[]))
    ORDER BY individu_id, combinaison_id, date_trunc($3::text, date::timestamp), date DESC, id DESC
  ) AS tronquees
) AS rangees
WHERE $5::int IS NULL OR rang <= $5::int
ORDER BY "individuId", "combinaisonId", "bucket";
