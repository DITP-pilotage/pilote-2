WITH

source AS (

    SELECT * FROM "dev_pilote__6230"."raw_data"."metadata_perimetres"

),

renamed AS (

    SELECT
        perimetre_id AS id,
        per_nom AS nom,
        per_porteur_id::TEXT AS ministere_id,
        per_porteur_name_short AS ministere_nom

    FROM source

)

SELECT * FROM renamed