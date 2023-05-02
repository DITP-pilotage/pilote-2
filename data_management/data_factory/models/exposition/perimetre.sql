SELECT
    id,
    nom,
    ministere_nom as ministere,
    porteurs.id as ministere_id
FROM {{ ref('stg_ppg_metadata__perimetres') }}
LEFT JOIN {{ ref('stg_ppg_metadata__porteurs') }} porteurs ON ministere_polygramme = polygramme
