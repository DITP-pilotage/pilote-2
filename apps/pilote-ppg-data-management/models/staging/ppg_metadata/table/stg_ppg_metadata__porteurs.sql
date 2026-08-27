
WITH

source AS (

    SELECT * FROM {{ source('ppg_metadata', 'metadata_porteurs') }}

),

renamed AS (

    SELECT
        porteur_id::TEXT AS id,
        porteur_short AS acronyme,
        porteur_name AS nom,
        porteur_desc AS description,
        porteur_type AS porteur_type_acronyme,
        porteur_directeur AS directeur,
        porteur_picto AS icone

    FROM source

)

SELECT * FROM renamed