{{ config(materialized = 'table') }}

WITH
utilisateur_mock_date_descativation AS (
    SELECT
        *,
        NOW() - (RANDOM() * interval '1500 days') AS date_descativation
    FROM {{ ref('utilisateur') }}
)

SELECT
    id,
    date_descativation
FROM utilisateur_mock_date_descativation
WHERE
    (NOW() - date_descativation)
    > interval '{{ var('retention_donnees_utilisateur_jours') }} days'
