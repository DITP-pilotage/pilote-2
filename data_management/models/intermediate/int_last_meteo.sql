{{ config(materialized = 'table') }}

WITH
synthese_triee_par_date AS (
    SELECT
        chantier_id,
        code_insee,
        maille,
        meteo,
        date_meteo,
        ROW_NUMBER()
            OVER (
                PARTITION BY chantier_id, code_insee, maille
                ORDER BY date_meteo DESC
            )
        AS row_id_by_date_meteo_desc
    FROM {{ source('db_schema_public', 'synthese_des_resultats') }}
)

SELECT
    a.chantier_id,
    t.code AS territoire_code,
    meteo,
    date_meteo
FROM synthese_triee_par_date AS a
LEFT JOIN {{ source('db_schema_public', 'territoire') }} AS t
    ON t.maille = LOWER(a.maille)::maille AND t.code_insee = a.code_insee
WHERE row_id_by_date_meteo_desc = 1
