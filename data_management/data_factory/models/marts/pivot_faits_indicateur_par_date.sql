-- Code de pivot de table.
--  Passage du format des
--      - format source:        fichier d'import:       1 colonne   type_mesure qui continent {vi, va, vc} + une colonne valeur
--      - format destination:   view_metric_indicateur: 3 colonnes  distinctes (vi, va, vc)

-- Ajout : gestion du cas de plusieurs valeur pour le même jour avec les dates d'import
-- FIXME: on ignore les académies avec la condition "AND zone_type_parent IN ('REG', 'NAT')" => a améliorer, Louise tu as peut-être des idées ?
WITH
pivot_valeur_initale as (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, type_mesure, date_releve ORDER by date_import DESC) AS row_id,
        indicateur_id,
        zone_id,
        date_releve,
        valeur as indicateur_valeur_initiale
    FROM {{ ref("faits_indicateur") }}
    WHERE type_mesure = 'vi'
      AND zone_type_parent IN ('REG', 'NAT') -- condition temporaire, c'est juste pour avoir les departements et région
),

pivot_valeur_initale_unique as (
    select * from pivot_valeur_initale WHERE row_id = 1
),

pivot_valeur_actuelle as (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, type_mesure, date_releve ORDER by date_import DESC) AS row_id,
        indicateur_id,
        zone_id,
        date_releve,
        valeur as indicateur_valeur_actuelle
    FROM {{ ref("faits_indicateur") }}
    WHERE type_mesure = 'va'
      AND zone_type_parent IN ('REG', 'NAT') -- condition temporaire, c'est juste pour avoir les departements et région
),

pivot_valeur_actuelle_unique as (
    select * from pivot_valeur_actuelle WHERE row_id = 1
),

pivot_valeur_cible as (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, type_mesure, date_releve ORDER by date_import DESC) AS row_id,
        indicateur_id,
        zone_id,
        date_releve,
        valeur as indicateur_valeur_cible
    FROM {{ ref("faits_indicateur") }}
    WHERE type_mesure = 'vc'
      AND zone_type_parent IN ('REG', 'NAT') -- condition temporaire, c'est juste pour avoir les departements et région
),

pivot_valeur_cible_unique as (
    select * from pivot_valeur_cible WHERE row_id = 1
),

join_valeur_initiale_valeur_actuelle as (
    SELECT
        COALESCE(pivot_valeur_initale_unique.indicateur_id, pivot_valeur_actuelle_unique.indicateur_id) as indicateur_id,
        COALESCE(pivot_valeur_initale_unique.zone_id, pivot_valeur_actuelle_unique.zone_id) as zone_id,
        COALESCE(pivot_valeur_initale_unique.date_releve, pivot_valeur_actuelle_unique.date_releve) as date_releve,
        pivot_valeur_initale_unique.indicateur_valeur_initiale,
        pivot_valeur_actuelle_unique.indicateur_valeur_actuelle
    FROM pivot_valeur_initale_unique full join pivot_valeur_actuelle_unique
        ON pivot_valeur_initale_unique.indicateur_id = pivot_valeur_actuelle_unique.indicateur_id
               AND pivot_valeur_initale_unique.zone_id = pivot_valeur_actuelle_unique.zone_id
               AND pivot_valeur_initale_unique.date_releve = pivot_valeur_actuelle_unique.date_releve
),

join_valeur_initiale_valeur_actuelle_valeur_cible as (
    SELECT
        COALESCE(pivot_valeur_cible_unique.indicateur_id, join_valeur_initiale_valeur_actuelle.indicateur_id) as indicateur_id,
        COALESCE(pivot_valeur_cible_unique.zone_id, join_valeur_initiale_valeur_actuelle.zone_id) as zone_id,
        COALESCE(pivot_valeur_cible_unique.date_releve, join_valeur_initiale_valeur_actuelle.date_releve) as date_releve,
        join_valeur_initiale_valeur_actuelle.indicateur_valeur_initiale,
        join_valeur_initiale_valeur_actuelle.indicateur_valeur_actuelle,
        pivot_valeur_cible_unique.indicateur_valeur_cible
    FROM pivot_valeur_cible_unique full join join_valeur_initiale_valeur_actuelle
        ON pivot_valeur_cible_unique.indicateur_id = join_valeur_initiale_valeur_actuelle.indicateur_id
               AND pivot_valeur_cible_unique.zone_id = join_valeur_initiale_valeur_actuelle.zone_id
               AND pivot_valeur_cible_unique.date_releve = join_valeur_initiale_valeur_actuelle.date_releve
)

SELECT *
FROM join_valeur_initiale_valeur_actuelle_valeur_cible
ORDER BY indicateur_id, zone_id, date_releve
