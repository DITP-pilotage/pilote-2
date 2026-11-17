-- Upsert atomique d'un batch de valeurs d'avancement pour un indicateur donné.
-- `payload.items` est un tableau JSON d'objets `{id, individuId, combinaisonId, date, valeur}`
-- (valeur exprimée en chaîne pour préserver la précision décimale). La combinaison de chaque
-- item est résolue en amont (la combinaison vide pour un indicateur sans axe).
-- Retourne, pour chaque ligne dans l'ordre du payload, si elle vient d'être créée
-- (`xmax = 0`) ou si elle a remplacé une valeur préexistante.
-- @param {String} $1:indicateurId
-- @param {Json} $2:payload
INSERT INTO valeur_avancement (id, indicateur_id, individu_id, combinaison_id, date, valeur, created_at, updated_at)
SELECT
  (input->>'id')::uuid,
  $1::uuid,
  (input->>'individuId')::uuid,
  (input->>'combinaisonId')::uuid,
  input->>'date',
  (input->>'valeur')::numeric,
  NOW(),
  NOW()
FROM jsonb_array_elements(($2::jsonb)->'items') AS input
ON CONFLICT (indicateur_id, individu_id, combinaison_id, date) DO UPDATE
SET valeur = EXCLUDED.valeur,
    updated_at = NOW()
RETURNING (xmax = 0) AS created;
