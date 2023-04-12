-- Code de pivot de table.
--  Passage du format des
--      - format source:        fichier d'import:       1 colonne   type_mesure qui continent {vi, va, vc} + une colonne valeur
--      - format destination:   view_metric_indicateur: 3 colonnes  distinctes (vi, va, vc)

-- Ajout : gestion du cas de plusieurs valeur pour le même jour avec les dates d'import
-- FIXME: on ignore les académies avec la condition "AND zone_type_parent IN ('REG', 'NAT')" => a améliorer, Louise tu as peut-être des idées ?
WITH
pivot_vi as (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, type_mesure, date_releve ORDER by date_import DESC) AS row_id,
        indicateur_id,
        zone_id,
        date_releve,
        valeur as indic_vi
    FROM {{ ref("faits_indicateur") }}
    WHERE type_mesure = 'vi'
      AND zone_type_parent IN ('REG', 'NAT') -- condition temporaire, c'est juste pour avoir les departements et région
),

pivot_vi_unique as (
    select * from pivot_vi WHERE row_id = 1
),

pivot_va as (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, type_mesure, date_releve ORDER by date_import DESC) AS row_id,
        indicateur_id,
        zone_id,
        date_releve,
        valeur as indic_va
    FROM {{ ref("faits_indicateur") }}
    WHERE type_mesure = 'va'
      AND zone_type_parent IN ('REG', 'NAT') -- condition temporaire, c'est juste pour avoir les departements et région
),

pivot_va_unique as (
    select * from pivot_va WHERE row_id = 1
),

pivot_vc as (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, type_mesure, date_releve ORDER by date_import DESC) AS row_id,
        indicateur_id,
        zone_id,
        date_releve,
        valeur as indic_vc
    FROM {{ ref("faits_indicateur") }}
    WHERE type_mesure = 'vc'
      AND zone_type_parent IN ('REG', 'NAT') -- condition temporaire, c'est juste pour avoir les departements et région
),

pivot_vc_unique as (
    select * from pivot_vc WHERE row_id = 1
),

join_vi_va as (
    SELECT
        COALESCE(pivot_vi_unique.indicateur_id, pivot_va_unique.indicateur_id) as indicateur_id,
        COALESCE(pivot_vi_unique.zone_id, pivot_va_unique.zone_id) as zone_id,
        COALESCE(pivot_vi_unique.date_releve, pivot_va_unique.date_releve) as date_releve,
        pivot_vi_unique.indic_vi,
        pivot_va_unique.indic_va
    FROM pivot_vi_unique full join pivot_va_unique
        ON pivot_vi_unique.indicateur_id = pivot_va_unique.indicateur_id
               AND pivot_vi_unique.zone_id = pivot_va_unique.zone_id
               AND pivot_vi_unique.date_releve = pivot_va_unique.date_releve
    WHERE pivot_vi_unique.row_id = 1
        OR pivot_va_unique.row_id = 1
),

join_vi_va_vc as (
    SELECT
        COALESCE(pivot_vc_unique.indicateur_id, join_vi_va.indicateur_id) as indicateur_id,
        COALESCE(pivot_vc_unique.zone_id, join_vi_va.zone_id) as zone_id,
        COALESCE(pivot_vc_unique.date_releve, join_vi_va.date_releve) as date_releve,
        join_vi_va.indic_vi,
        join_vi_va.indic_va,
        pivot_vc_unique.indic_vc
    FROM pivot_vc_unique full join join_vi_va
        ON pivot_vc_unique.indicateur_id = join_vi_va.indicateur_id
               AND pivot_vc_unique.zone_id = join_vi_va.zone_id
               AND pivot_vc_unique.date_releve = join_vi_va.date_releve
)

SELECT *
FROM join_vi_va_vc
ORDER BY indicateur_id, zone_id, date_releve