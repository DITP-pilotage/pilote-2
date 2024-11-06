SELECT
    id,
    nom,
    false AS a_supprimer
FROM {{ ref('stg_ppg_metadata__ppgs') }}
