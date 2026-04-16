

WITH

source AS (

    SELECT * FROM "dev_pilote__6230"."raw_data"."commentaires"

),

renamed AS (

    SELECT
        chantier_id,
        "type",
        contenu,
        TO_DATE("date", 'DD/MM/YYYY') AS "date",
        NULL::TEXT AS auteur,
        auteur_email,
        maille,
        code_insee::VARCHAR AS code_insee,
        TO_DATE(date_meteo, 'DD/MM/YYYY') AS date_meteo,
        meteo
    FROM source

)

SELECT * FROM renamed