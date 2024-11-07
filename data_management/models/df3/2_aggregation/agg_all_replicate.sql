{{ config(materialized = 'table') }}

WITH 
-- Chantiers à répliquer depuis la REG
to_replicate_from_reg AS (
    SELECT
        id as chantier_id,
        'REG' AS replicate_maille_from,
        replicate_val_reg_to AS replicate_maille_to
    FROM {{ ref('stg_ppg_metadata__chantiers') }}
    WHERE replicate_val_reg_to IS NOT null
),

-- Chantiers à répliquer depuis la NAT
to_replicate_from_nat AS (
    SELECT
        id as chantier_id,
        'NAT' AS replicate_maille_from,
        replicate_val_nat_to AS replicate_maille_to
    FROM {{ ref('stg_ppg_metadata__chantiers') }}
    WHERE replicate_val_nat_to IS NOT null
),


-- Tableau des chantier à répliquer de maille X -> Y
src_chantier_mailles_to_replicate AS (
    SELECT * FROM to_replicate_from_reg
    UNION
    SELECT * FROM to_replicate_from_nat
),

-- Liste des zones où répliquer les données
src_chantier_zones_to_replicate AS (
    SELECT
        a.chantier_id,
        b.zone_id,
        b.zone_type,
        b.zone_parent AS zone_id_parent,
        b.zone_parent_type AS zone_type_parent
    FROM src_chantier_mailles_to_replicate AS a
    LEFT JOIN
        {{ ref('zone_parent') }} AS b
        ON
            a.replicate_maille_from = b.zone_parent_type
            AND a.replicate_maille_to = b.zone_type
),

-- Valeurs de la maille sup (X)
valeurs_region_src AS (
    SELECT
        a.*,
        b.chantier_id,
        c.zone_id AS zone_id_child
    FROM {{ ref('agg_all') }} AS a
    LEFT JOIN
        {{ ref('stg_ppg_metadata__indicateurs') }} AS b
        ON a.indic_id = b.id
    INNER JOIN
        src_chantier_zones_to_replicate AS c
        ON a.zone_id = c.zone_id_parent AND b.chantier_id = c.chantier_id
--where b.chantier_id ='CH-006' and a.zone_id = 'R84'
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
    --, b.*
    FROM valeurs_region_src
    ORDER BY indic_id, metric_date
)

-- Union des données précédentes avec les données répliquées
SELECT * 
FROM {{ ref('agg_all') }} 
WHERE (indic_id, zone_id) NOT IN (SELECT indic_id, zone_id FROM replicated_values)
UNION 
SELECT * 
FROM replicated_values
