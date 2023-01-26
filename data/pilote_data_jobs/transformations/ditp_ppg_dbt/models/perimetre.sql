SELECT
    '1' as id,
    nom,
    ministere_nom as ministere
FROM {{ ref('stg_ppg_metadata__perimetres') }}