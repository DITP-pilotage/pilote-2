-- Jalon le plus tardif avec une VACG disponible pour chaque {indic_id, zone_id}

WITH tri_des_jalons AS (
    SELECT
        indic_id,
        zone_id,
        metric_date,
        vacg,
        jalon,
        ROW_NUMBER()
            OVER (PARTITION BY indic_id, zone_id ORDER BY jalon DESC)
            AS r

    FROM "dev_pilote__6230"."df3"."get_last_vacg_jalon_nofill"
    WHERE
        -- jalon pas dans le futur
        jalon < DATE_PART('year', NOW()) + 1
)

SELECT
    indic_id,
    zone_id,
    metric_date AS derniere_date_vacg,
    vacg AS derniere_vacg,
    jalon AS dernier_jalon
FROM tri_des_jalons
WHERE r = 1