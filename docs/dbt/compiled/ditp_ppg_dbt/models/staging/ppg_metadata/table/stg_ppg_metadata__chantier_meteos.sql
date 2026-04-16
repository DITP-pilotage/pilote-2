WITH

source AS (

    SELECT * FROM "dev_pilote__6230"."raw_data"."metadata_chantier_meteos"

),

renamed AS (

    SELECT
        ch_meteo_id AS id,
        ch_meteo_name AS nom,
        ch_meteo_descr AS description,
        ch_meteo_name_dfakto AS nom_dfakto

    FROM source

)

SELECT * FROM renamed