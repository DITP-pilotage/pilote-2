WITH

source AS (

    SELECT * FROM {{ source('python_load', 'metadata_ppgs') }}

),

renamed AS (

    SELECT
        ppg_id AS id,
        ppg_axe AS axe_id,
        ppg_code AS code,
        ppg_desc AS description,
        ppg_nom AS nom,
        STRING_TO_ARRAY(porteur_shorts, ' | ') AS porteur_noms_court,
        STRING_TO_ARRAY(porteur_ids, ' | ') AS porteur_ids

    FROM source

)

SELECT * FROM renamed
