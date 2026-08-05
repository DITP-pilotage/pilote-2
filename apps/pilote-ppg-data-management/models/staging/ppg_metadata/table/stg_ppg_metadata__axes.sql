WITH

source AS (

    SELECT * FROM {{ source('ppg_metadata', 'metadata_axes') }}

),

renamed AS (

    SELECT
        axe_id AS id,
        axe_name AS nom,
        axe_desc AS description

    FROM source

)

SELECT * FROM renamed
