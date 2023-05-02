SELECT
    id,
    nom,
    ministere_nom as ministere,
    ministere_id
FROM {{ ref('stg_ppg_metadata__perimetres') }}
WHERE ministere_id is not null
