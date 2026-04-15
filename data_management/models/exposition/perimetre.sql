SELECT
    id,
    nom,
    ministere_nom AS ministere,
    ministere_id,
    FALSE AS a_supprimer
FROM {{ ref('stg_ppg_metadata__perimetres') }}
WHERE ministere_id IS NOT NULL
