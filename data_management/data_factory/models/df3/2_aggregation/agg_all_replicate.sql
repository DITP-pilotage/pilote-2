{{ config(materialized = 'table') }}

WITH

-- Tableau des chantier à répliquer de maille X -> Y
src_chantier_mailles_to_replicate AS (
    SELECT * FROM (
        VALUES
        ('CH-006', 'DEPT', 'REG'), ('CH-015', 'DEPT', 'REG')
    ) AS t (chantier_id, replicate_maille_to, replicate_maille_from)
    WHERE chantier_id = 'CH-006' --and zone_id_parent='R84'
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

--select indic_id, zone_id, count(*) as n from replicated_values group by indic_id, zone_id

-- Union des données précédentes avec les données répliquées
SELECT * FROM {{ ref('agg_all') }}
UNION
SELECT * FROM replicated_values
