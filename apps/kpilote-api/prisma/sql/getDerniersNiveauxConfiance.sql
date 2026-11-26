-- Indice du dernier commentaire CONFIANCE publié de chaque couple (indicateur,
-- individu) demandé, comme la fiche indicateur le lit. Les couples arrivent en
-- deux tableaux alignés ($1[i], $2[i]). Si le dernier commentaire publié ne
-- porte pas de niveau, le couple n'a pas de ligne : on ne remonte pas vers un
-- commentaire plus ancien. uuidv7 : l'id le plus grand est le plus récent.
-- @param $1:indicateurIds
-- @param $2:individuIds
WITH couples AS (
  SELECT * FROM unnest($1::uuid[], $2::uuid[]) AS couple(indicateur_id, individu_id)
),
derniers_commentaires AS (
  SELECT DISTINCT ON (satellite.indicateur_id, satellite.individu_id)
    satellite.indicateur_id,
    satellite.individu_id,
    satellite.commentaire_id
  FROM indicateur_individu_commentaire AS satellite
  JOIN couples
    ON couples.indicateur_id = satellite.indicateur_id
   AND couples.individu_id = satellite.individu_id
  JOIN commentaire ON commentaire.id = satellite.commentaire_id
  WHERE satellite.type = 'CONFIANCE'
    AND commentaire.statut = 'PUBLIE'
  ORDER BY satellite.indicateur_id, satellite.individu_id, satellite.commentaire_id DESC
)
SELECT DISTINCT ON (derniers_commentaires.indicateur_id, derniers_commentaires.individu_id)
  derniers_commentaires.indicateur_id AS "indicateurId",
  derniers_commentaires.individu_id   AS "individuId",
  niveau_confiance.indice             AS "indice"
FROM derniers_commentaires
JOIN niveau_confiance ON niveau_confiance.commentaire_id = derniers_commentaires.commentaire_id
ORDER BY
  derniers_commentaires.indicateur_id,
  derniers_commentaires.individu_id,
  niveau_confiance.id DESC;
