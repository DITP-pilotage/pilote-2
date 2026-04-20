SELECT
    id,
    nom,
    FALSE AS a_supprimer
FROM {{ ref('stg_ppg_metadata__axes') }}
WHERE nom IS NOT NULL
