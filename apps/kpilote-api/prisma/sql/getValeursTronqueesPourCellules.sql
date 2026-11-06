-- Saisies tronquées (une par bucket) pour les cellules données (par clé canonique)
-- sur un indicateur. Utilisé pour les séries de valeurs (saisies feuilles +
-- combineLatest des séries dérivées). En cas de plusieurs saisies dans le même
-- bucket, on garde la plus récente (date DESC, id DESC pour départager les saisies
-- du même jour).
-- $3 = unité de troncature : 'day' | 'week' | 'month' | 'quarter' | 'year'.
-- @param {String} $1:indicateurId
-- @param {String} $3:dateTrunc
SELECT DISTINCT ON (c.cle, date_trunc($3::text, v.date::timestamp))
  c.cle                                                               AS "cle",
  to_char(date_trunc($3::text, v.date::timestamp), 'YYYY-MM-DD')      AS "bucket",
  v.date                                                              AS "dateOrigine",
  v.valeur
FROM valeur_avancement v
JOIN cellule c ON c.id = v.cellule_id
WHERE v.indicateur_id = $1::uuid
  AND c.cle = ANY($2::text[])
ORDER BY c.cle, date_trunc($3::text, v.date::timestamp), v.date DESC, v.id DESC;
