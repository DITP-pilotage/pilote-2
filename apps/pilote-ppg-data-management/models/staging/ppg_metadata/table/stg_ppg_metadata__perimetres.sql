WITH

source AS (

    SELECT * FROM {{ source('ppg_metadata', 'metadata_perimetres') }}

),

porteurs AS (

    SELECT * FROM {{ source('ppg_metadata', 'metadata_porteurs') }}

),

renamed AS (

    SELECT
        source.perimetre_id AS id,
        source.per_nom AS nom,
        source.per_porteur_id::TEXT AS ministere_id,
        porteurs.porteur_name_short AS ministere_nom

    FROM source
    LEFT JOIN porteurs ON source.per_porteur_id::TEXT = porteurs.porteur_id::TEXT

)

SELECT * FROM renamed
