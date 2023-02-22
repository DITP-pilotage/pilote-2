SELECT
    id,
    nom
FROM {{ ref('stg_ppg_metadata__axes') }}