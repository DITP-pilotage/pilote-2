WITH chantiers_baro AS (
-- ID des chantiers dans le baromètre
    SELECT
        indic_parent_ch AS chantier_id,
        count(*) AS n
    FROM "dev_pilote__6230"."barometre"."baro_meta_indicateurs"
    GROUP BY indic_parent_ch
    ORDER BY indic_parent_ch
)

-- On ajoute le nom et l'engagement correspondant pour chaque chantier
SELECT
    a.chantier_id,
    b.nom AS ch_nom,
    b.nom_engagement AS engagement_short
FROM chantiers_baro AS a
LEFT JOIN "dev_pilote__6230"."raw_data"."stg_ppg_metadata__chantiers" AS b ON a.chantier_id = b.id