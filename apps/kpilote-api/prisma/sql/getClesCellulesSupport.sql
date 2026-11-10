-- Clés canoniques des cellules d'un indicateur portant au moins un fait du type
-- demandé ($2 = 'valeurs' | 'objectifs'). Sert de « support » au calcul
-- multi-dimension : hors marginale pure, une cellule enfant n'est attendue que si
-- son sous-cube contient une cellule de ce support. Valeurs et objectifs ont des
-- supports distincts (un objectif est prospectif : il ne doit pas dépendre des
-- valeurs saisies, et une valeur sans objectif ne doit pas bloquer un objectif
-- strict). Jamais calculé sur l'existence d'une ligne `cellule` (un commentaire
-- ne change aucun chiffre).
-- @param {String} $1:indicateurId
-- @param {String} $2:typeFait
SELECT c.cle AS "cle"
FROM cellule c
WHERE c.indicateur_id = $1::uuid
  AND (
    ($2::text = 'valeurs' AND EXISTS (SELECT 1 FROM valeur_avancement v WHERE v.cellule_id = c.id))
    OR ($2::text = 'objectifs' AND EXISTS (SELECT 1 FROM objectif_indicateur_individu o WHERE o.cellule_id = c.id))
  );
