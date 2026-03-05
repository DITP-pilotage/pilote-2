

WITH
-- Chantiers à répliquer depuis la REG
to_replicate_from_reg AS (
    SELECT
        id AS chantier_id,
        'REG' AS replicate_maille_from,
        replicate_val_reg_to AS replicate_maille_to
    FROM "dev_pilote__6230"."raw_data"."stg_ppg_metadata__chantiers"
    WHERE replicate_val_reg_to IS NOT NULL
),

-- Chantiers à répliquer depuis la NAT
to_replicate_from_nat AS (
    SELECT
        id AS chantier_id,
        'NAT' AS replicate_maille_from,
        replicate_val_nat_to AS replicate_maille_to
    FROM "dev_pilote__6230"."raw_data"."stg_ppg_metadata__chantiers"
    WHERE replicate_val_nat_to IS NOT NULL
),

-- Tableau des chantier à répliquer de maille X -> Y
src_chantier_mailles_to_replicate AS (
    SELECT
        chantier_id,
        replicate_maille_from,
        replicate_maille_to
    FROM to_replicate_from_reg
    UNION ALL
    SELECT
        chantier_id,
        replicate_maille_from,
        replicate_maille_to
    FROM to_replicate_from_nat
),

-- Liste des zones où répliquer les données
src_chantier_zones_to_replicate AS (
    SELECT
        ch_mailles_to_replicate.chantier_id,
        maille_parent.zone_id,
        maille_parent.zone_type,
        maille_parent.zone_parent AS zone_id_parent,
        maille_parent.zone_parent_type AS zone_type_parent
    FROM src_chantier_mailles_to_replicate AS ch_mailles_to_replicate
    LEFT JOIN
        "dev_pilote__6230"."df3"."zone_parent" AS maille_parent
        ON
            ch_mailles_to_replicate.replicate_maille_from
            = maille_parent.zone_parent_type
            AND ch_mailles_to_replicate.replicate_maille_to
            = maille_parent.zone_type
),

-- Valeurs de la maille sup (X)
valeurs_region_src AS (
    SELECT
        agg_all.id,
        agg_all.date_import,
        agg_all.indic_id,
        agg_all.zone_id,
        agg_all.metric_date,
        agg_all.metric_type,
        agg_all.metric_value,
        metadata_indicateurs.chantier_id,
        ch_zones_to_replicate.zone_id AS zone_id_child
    FROM "dev_pilote__6230"."df3"."agg_all" AS agg_all
    LEFT JOIN
        "dev_pilote__6230"."raw_data"."stg_ppg_metadata__indicateurs" AS metadata_indicateurs
        ON agg_all.indic_id = metadata_indicateurs.id
    INNER JOIN
        src_chantier_zones_to_replicate AS ch_zones_to_replicate
        ON
            agg_all.zone_id = ch_zones_to_replicate.zone_id_parent
            AND metadata_indicateurs.chantier_id
            = ch_zones_to_replicate.chantier_id
--where metadata_indicateurs.chantier_id ='CH-006' and agg_all.zone_id = 'R84'
),

-- Valeurs répliquées (dans Y) bien formatées
replicated_values AS (
    SELECT
        id,
        date_import,
        indic_id,
        zone_id_child AS zone_id,
        metric_date,
        metric_type,
        metric_value
    FROM valeurs_region_src
    --ORDER BY indic_id, metric_date
)

-- Union des données précédentes avec les données répliquées
SELECT
    agg_all.id,
    agg_all.date_import,
    agg_all.indic_id,
    agg_all.zone_id,
    agg_all.metric_date,
    agg_all.metric_type,
    agg_all.metric_value
FROM "dev_pilote__6230"."df3"."agg_all" AS agg_all
WHERE
    (agg_all.indic_id, agg_all.zone_id) NOT IN (
        SELECT
            replicated_values.indic_id,
            replicated_values.zone_id
        FROM replicated_values
    )
UNION ALL
SELECT
    id,
    date_import,
    indic_id,
    zone_id,
    metric_date,
    metric_type,
    metric_value
FROM replicated_values