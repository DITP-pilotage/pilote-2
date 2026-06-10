-- Upsert atomique d'un batch d'objectifs pour un indicateur donné.
-- `payload.items` est un tableau JSON d'objets `{id, individuId, dateCible, valeurCible}` (valeurCible
-- exprimée en chaîne pour préserver la précision décimale).
-- Retourne, pour chaque ligne dans l'ordre du payload, si elle vient d'être créée
-- (`xmax = 0`) ou si elle a remplacé un objectif préexistant.
-- @param {String} $1:indicateurId
-- @param {Json} $2:payload
INSERT INTO objectif_indicateur_individu (id, indicateur_id, individu_id, date_cible, valeur_cible, created_at, updated_at)
SELECT
  (input->>'id')::uuid,
  $1::uuid,
  (input->>'individuId')::uuid,
  input->>'dateCible',
  (input->>'valeurCible')::numeric,
  NOW(),
  NOW()
FROM jsonb_array_elements(($2::jsonb)->'items') AS input
ON CONFLICT (indicateur_id, individu_id, date_cible) DO UPDATE
SET valeur_cible = EXCLUDED.valeur_cible,
    updated_at = NOW()
RETURNING (xmax = 0) AS created;
