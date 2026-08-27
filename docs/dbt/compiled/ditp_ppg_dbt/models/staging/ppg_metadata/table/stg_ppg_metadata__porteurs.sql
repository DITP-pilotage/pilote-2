WITH

source AS (

    SELECT * FROM "dev_pilote__6230"."raw_data"."metadata_porteurs"

),

renamed AS (

    SELECT
        porteur_id::TEXT AS id,
        porteur_short AS acronyme,
        porteur_name AS nom,
        porteur_desc AS description,
        porteur_type AS porteur_type_acronyme,
        porteur_directeur AS directeur,
        COALESCE(porteur_name_short, porteur_name) AS nom_court,
        porteur_picto AS icone

    FROM source

)

SELECT * FROM renamed