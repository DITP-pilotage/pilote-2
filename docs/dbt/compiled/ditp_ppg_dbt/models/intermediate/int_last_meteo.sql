

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
    FROM "dev_pilote__6230"."public"."synthese_des_resultats"
)

SELECT
    a.chantier_id,
    t.code AS territoire_code,
    meteo,
    date_modification as date_meteo
FROM synthese_triee_par_date AS a
LEFT JOIN "dev_pilote__6230"."public"."territoire" AS t
    ON t.maille = LOWER(a.maille)::maille AND t.code_insee = a.code_insee
WHERE row_id_by_date_meteo_desc = 1