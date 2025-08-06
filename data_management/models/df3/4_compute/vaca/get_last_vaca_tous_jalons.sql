-- Jalon le plus tardif avec une VACA disponible pour chaque {indic_id, zone_id}


WITH tri_des_jalons AS (
    SELECT
        indic_id,
        zone_id,
        metric_date,
        vaca,
        jalon,
        row_number()
            OVER (PARTITION BY indic_id, zone_id, jalon ORDER BY jalon DESC)
        AS r

    FROM {{ ref('get_last_vaca_jalon_nofill') }}
    WHERE
        -- jalon pas dans le futur
        jalon < date_part('year', now()) + 1
)

SELECT
    indic_id,
    zone_id,
    metric_date as derniere_date_vaca,
    vaca as derniere_vaca,
    jalon as dernier_jalon
FROM tri_des_jalons
WHERE
    r = 1