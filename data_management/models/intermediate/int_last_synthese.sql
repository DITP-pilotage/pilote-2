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
-- Indique la date de météo la plus récente
SELECT * FROM synthese_triee_par_date WHERE row_id_by_date_meteo_desc = 1

