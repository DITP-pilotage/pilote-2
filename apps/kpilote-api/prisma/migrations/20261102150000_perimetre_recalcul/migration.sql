-- Cloisonnement (POC dimensions, M1‴) : filet fail-closed. Sur un environnement
-- où les migrations 20261102130000 (périmètre par présence de lignes) et
-- 20261102140000 (drapeau `perimetre_restreint`, défaut false) ont été
-- appliquées séparément, des lignes de périmètre ont pu être posées entre les
-- deux : leur permission resterait marquée non restreinte, donc ouverte.
-- Toute permission qui porte au moins une ligne de périmètre est restreinte.
-- Idempotente : sans effet sur une base déjà cohérente.
UPDATE "indicateur_permission" p
SET "perimetre_restreint" = true
WHERE EXISTS (
  SELECT 1
  FROM "indicateur_permission_perimetre" x
  WHERE x."principal_id" = p."principal_id"
    AND x."indicateur_id" = p."indicateur_id"
    AND x."action" = p."action"
);
