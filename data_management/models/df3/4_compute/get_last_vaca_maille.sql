-- Pour chaque indic,maille:
-- 	retourne la date de VA la + récente

SELECT
    last_vaca.indic_id,
    zones.maille,
    MAX(last_vaca.date_valeur_actuelle) AS last_va_date,
    COUNT(*) AS n
FROM {{ ref('get_last_vaca') }} AS last_vaca
LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS zones
    ON last_vaca.zone_id = zones.id
GROUP BY zones.maille, last_vaca.indic_id
