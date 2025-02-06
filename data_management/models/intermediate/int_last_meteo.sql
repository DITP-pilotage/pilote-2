{{ config(materialized = 'table') }}

WITH
synthese_triee_par_date AS (
    SELECT
        chantier_id,
		territoire_code,
        meteo,
        date_meteo,
        ROW_NUMBER()
            OVER (
                PARTITION BY chantier_id, territoire_code
                ORDER BY date_meteo DESC
            )
        AS row_id_by_date_meteo_desc
    FROM {{ source('db_schema_public', 'synthese_des_resultats') }}
)

SELECT
    a.chantier_id,
    territoire_code,
    meteo,
    date_meteo
FROM synthese_triee_par_date AS a
WHERE row_id_by_date_meteo_desc = 1
