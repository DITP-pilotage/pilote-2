WITH

source AS (

    SELECT * FROM {{ source('ppg_metadata', 'metadata_indicateur_types') }}

),

renamed AS (

    SELECT
        indic_type_id AS id,
        indic_type_name AS nom,
        indic_type_descr AS description

    FROM source

)

SELECT * FROM renamed
