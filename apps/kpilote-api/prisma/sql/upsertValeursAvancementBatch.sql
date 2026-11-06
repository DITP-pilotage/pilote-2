-- Upsert atomique d'un batch de valeurs d'avancement pour un indicateur donné.
-- `payload.items` est un tableau JSON d'objets `{id, celluleId, date, valeur}` (valeur
-- exprimée en chaîne pour préserver la précision décimale). Les cellules sont
-- résolues (et créées si besoin) en amont par la commande.
-- Retourne, pour chaque ligne dans l'ordre du payload, si elle vient d'être créée
-- (`xmax = 0`) ou si elle a remplacé une valeur préexistante.
-- @param {String} $1:indicateurId
-- @param {Json} $2:payload
INSERT INTO valeur_avancement (id, indicateur_id, cellule_id, date, valeur, created_at, updated_at)
SELECT
  (input->>'id')::uuid,
  $1::uuid,
  (input->>'celluleId')::uuid,
  input->>'date',
  (input->>'valeur')::numeric,
  NOW(),
  NOW()
FROM jsonb_array_elements(($2::jsonb)->'items') AS input
ON CONFLICT (indicateur_id, cellule_id, date) DO UPDATE
SET valeur = EXCLUDED.valeur,
    updated_at = NOW()
RETURNING (xmax = 0) AS created;
