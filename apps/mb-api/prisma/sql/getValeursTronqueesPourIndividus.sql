-- Saisies tronquées (une par bucket) pour les individus donnés sur un indicateur.
-- Utilisé pour les séries de valeurs (saisies feuilles + combineLatest des séries dérivées).
-- En cas de plusieurs saisies dans le même bucket, on garde la plus récente
-- (date DESC, id DESC pour départager les saisies du même jour).
-- $3 = unité de troncature : 'day' | 'week' | 'month' | 'quarter' | 'year'.
SELECT DISTINCT ON (individu_id, date_trunc($3::text, date::timestamp))
  individu_id                                                       AS "individuId",
  to_char(date_trunc($3::text, date::timestamp), 'YYYY-MM-DD')      AS "bucket",
  date                                                              AS "dateOrigine",
  valeur
FROM valeur_avancement
WHERE indicateur_id = $1
  AND individu_id = ANY($2)
ORDER BY individu_id, date_trunc($3::text, date::timestamp), date DESC, id DESC;
