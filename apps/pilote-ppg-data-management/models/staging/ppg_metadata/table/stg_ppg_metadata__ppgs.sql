WITH

source AS (

    SELECT * FROM {{ source('ppg_metadata', 'metadata_ppgs') }}

),

renamed AS (

    SELECT
        ppg_id AS id,
        ppg_desc AS description,
        ppg_nom AS nom

    FROM source

)

SELECT * FROM renamed
