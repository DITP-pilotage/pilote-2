-- Pour chaque indic,maille:
-- 	retourne la date de VA la + récente

WITH get_last_vaca_maille AS (
    SELECT
        a.indic_id,
        b.maille,
        max(a.date_valeur_actuelle::date) AS last_va_date,
		count(*) AS n
    FROM {{ ref('get_last_vaca') }} AS a
    LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS b ON a.zone_id = b.id
    GROUP BY b.maille, a.indic_id
)

SELECT * FROM get_last_vaca_maille
