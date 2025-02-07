-- Jalon le plus tardif avec une VACG disponible pour chaque {indic_id, zone_id}

WITH tri_des_jalons AS (
    SELECT
        indic_id,
        zone_id,
        metric_date,
        vacg,
        jalon,
        row_number()
            OVER (PARTITION BY indic_id, zone_id ORDER BY jalon DESC)
        AS r

    FROM {{ ref('get_last_vacg_jalon_nofill') }}
    WHERE
        -- jalon pas dans le futur
        jalon < date_part('year', now()) + 1
)

SELECT
    indic_id,
    zone_id,
    metric_date as derniere_date_vacg,
    vacg as derniere_vacg,
    jalon as dernier_jalon
FROM tri_des_jalons
WHERE r = 1
