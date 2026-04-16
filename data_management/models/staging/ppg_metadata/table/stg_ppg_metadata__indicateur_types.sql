WITH

source AS (

    SELECT * FROM {{ source('python_load', 'metadata_indicateur_types') }}

),

renamed AS (

    SELECT
        indic_type_id AS id,
        indic_type_name AS nom,
        indic_type_descr AS description,
        indic_type_rank AS rang

    FROM source

)

SELECT * FROM renamed
