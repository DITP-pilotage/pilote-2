-- Pour chaque indic,maille:
-- 	retourne la date de VA la + récente

WITH get_last_vaca_maille AS (
    SELECT
        a.indic_id,
        b.maille,
        max(a.date_valeur_actuelle) AS last_va_date,
		count(*) AS n
    FROM "dev_pilote__6230"."df3"."get_last_vaca" AS a
    LEFT JOIN "dev_pilote__6230"."raw_data"."stg_ppg_metadata__zones" AS b ON a.zone_id = b.id
    GROUP BY b.maille, a.indic_id
)

SELECT * FROM get_last_vaca_maille