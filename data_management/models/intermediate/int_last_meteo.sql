{{ config(materialized = 'table') }}

WITH
synthese_triee_par_date AS (
    SELECT
        chantier_id,
        code_insee,
        maille,
        meteo,
        date_modification,
        ROW_NUMBER()
            OVER (
                PARTITION BY chantier_id, code_insee, maille
                ORDER BY date_modification DESC
            )
            AS row_id_by_date_meteo_desc
    FROM {{ source('db_schema_public', 'synthese_des_resultats') }}
)

SELECT
    synthese_triee_par_date.chantier_id,
    territoire.code AS territoire_code,
    synthese_triee_par_date.meteo,
    synthese_triee_par_date.date_modification AS date_meteo
FROM synthese_triee_par_date
LEFT JOIN {{ source('db_schema_public', 'territoire') }} AS territoire
    ON
        territoire.maille = LOWER(synthese_triee_par_date.maille)::MAILLE
        AND synthese_triee_par_date.code_insee = territoire.code_insee
WHERE synthese_triee_par_date.row_id_by_date_meteo_desc = 1
