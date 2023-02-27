SELECT
    id,
    nom
FROM {{ ref('stg_ppg_metadata__axes') }}
WHERE nom is not null
