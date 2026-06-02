-- Objectifs bucketisés (un par individu/bucket) pour les individus donnés sur un indicateur.
-- En cas de plusieurs objectifs dans le même bucket, on garde le plus récent
-- (date_cible DESC, id DESC pour départager ceux du même jour).
-- $3 = unité de troncature : 'day' | 'week' | 'month' | 'quarter' | 'year'.
SELECT DISTINCT ON (individu_id, date_trunc($3::text, date_cible::timestamp))
  individu_id                                                                    AS "individuId",
  to_char(date_trunc($3::text, date_cible::timestamp), 'YYYY-MM-DD')            AS "bucket",
  valeur_cible                                                                   AS "valeurCible"
FROM objectif_indicateur_individu
WHERE indicateur_id = $1
  AND individu_id = ANY($2)
ORDER BY individu_id, date_trunc($3::text, date_cible::timestamp), date_cible DESC, id DESC;
