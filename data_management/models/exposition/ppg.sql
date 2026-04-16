SELECT
    id,
    nom,
    FALSE AS a_supprimer
FROM {{ ref('stg_ppg_metadata__ppgs') }}
