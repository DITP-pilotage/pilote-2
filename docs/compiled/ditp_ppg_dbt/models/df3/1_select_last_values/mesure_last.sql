-- Objectif: retourner uniquement la valeur importée le plus récemment
--  pour chaque {indic_id, metric_type, metric_month, zone_id}


WITH
-- On trie, pour chaque {indic_id, metric_type, metric_month, zone_id}
-- les valeurs par date d'import la plus récente
rank_mesures AS (
    SELECT
        mesures.date_import,
        mesures.indic_id,
        mesures.metric_date,
        mesures.metric_month,
        mesures.metric_type,
        mesures.metric_value,
        mesures.zone_id,
        mesures.id,
        mesures.rapport_id,
        ROW_NUMBER()
            OVER (
                PARTITION BY
                    mesures.indic_id,
                    mesures.metric_type,
                    mesures.zone_id,
                    mesures.metric_month
                ORDER BY mesures.date_import DESC,
                -- si jamais 2 dates pour le même mois dans le même import
                mesures.metric_date DESC,
                -- critère de repli pour rendre le tri déterministe
                mesures.id DESC
            )
            AS r
    FROM "dev_pilote__6230"."df3"."stg_mesure_indicateur" AS mesures
    INNER JOIN
        "dev_pilote__6230"."raw_data"."stg_ppg_metadata__indicateurs" AS indic
        ON mesures.indic_id = indic.id
    LEFT JOIN
        "dev_pilote__6230"."marts"."int_indicateurs_zones_applicables"
            AS zones_applicables_indic
        ON
            mesures.indic_id = zones_applicables_indic.indic_id
            AND mesures.zone_id = zones_applicables_indic.zone_id
    WHERE
        -- On ne garde que les valeurs sur un territoire applicable  
        COALESCE(zones_applicables_indic.est_applicable, TRUE)
)

-- et on garde pour chacun de ces groupes la plus récente
SELECT
    date_import,
    indic_id,
    metric_month AS metric_date,
    metric_type,
    metric_value,
    zone_id,
    id,
    rapport_id
FROM rank_mesures
WHERE r = 1