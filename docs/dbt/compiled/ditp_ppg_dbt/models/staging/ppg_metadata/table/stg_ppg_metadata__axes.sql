WITH

source AS (

    SELECT * FROM "dev_pilote__6230"."raw_data"."metadata_axes"

),

renamed AS (

    SELECT
        axe_id AS id,
        axe_short AS nom_court,
        axe_name AS nom,
        axe_desc AS description

    FROM source

)

SELECT * FROM renamed