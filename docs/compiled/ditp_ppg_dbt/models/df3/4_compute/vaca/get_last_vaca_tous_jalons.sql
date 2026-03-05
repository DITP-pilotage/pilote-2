-- Jalon le plus tardif avec une VACA disponible pour chaque {indic_id, zone_id}


WITH tri_des_jalons AS (
    SELECT
        indic_id,
        zone_id,
        metric_date,
        vaca,
        jalon,
        ROW_NUMBER()
            OVER (PARTITION BY indic_id, zone_id, jalon ORDER BY jalon DESC)
            AS r

    FROM "dev_pilote__6230"."df3"."get_last_vaca_jalon_nofill"
    WHERE
        -- jalon pas dans le futur
        jalon < DATE_PART('year', NOW()) + 1
)

SELECT
    indic_id,
    zone_id,
    metric_date AS derniere_date_vaca,
    vaca AS derniere_vaca,
    jalon AS dernier_jalon
FROM tri_des_jalons
WHERE
    r = 1