-- Objectifs bucketisés (un par cellule/bucket) pour les cellules données (par clé
-- canonique) sur un indicateur. En cas de plusieurs objectifs dans le même bucket,
-- on garde le plus récent (date_cible DESC, id DESC pour départager ceux du même jour).
-- $3 = unité de troncature : 'day' | 'week' | 'month' | 'quarter' | 'year'.
-- @param {String} $1:indicateurId
-- @param {String} $3:dateTrunc
SELECT DISTINCT ON (c.cle, date_trunc($3::text, o.date_cible::timestamp))
  c.cle                                                                AS "cle",
  to_char(date_trunc($3::text, o.date_cible::timestamp), 'YYYY-MM-DD') AS "bucket",
  o.valeur_cible                                                       AS "valeurCible"
FROM objectif_indicateur_individu o
JOIN cellule c ON c.id = o.cellule_id
WHERE o.indicateur_id = $1::uuid
  AND c.cle = ANY($2::text[])
ORDER BY c.cle, date_trunc($3::text, o.date_cible::timestamp), o.date_cible DESC, o.id DESC;
