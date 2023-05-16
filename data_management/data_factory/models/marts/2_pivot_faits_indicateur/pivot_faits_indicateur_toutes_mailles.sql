WITH
pivot_valeur_initale as (
    SELECT
        indicateur_id,
        zone_id,
        date_releve,
        valeur as indicateur_valeur_initiale
    FROM {{ ref("faits_indicateur_toutes_mailles") }}
    WHERE type_mesure = 'vi'
),

pivot_valeur_actuelle as (
    SELECT
        indicateur_id,
        zone_id,
        date_releve,
        valeur as indicateur_valeur_actuelle
    FROM {{ ref("faits_indicateur_toutes_mailles") }}
    WHERE type_mesure = 'va'
),

pivot_valeur_cible as (
    SELECT
        indicateur_id,
        zone_id,
        date_releve,
        valeur as indicateur_valeur_cible
    FROM {{ ref("faits_indicateur_toutes_mailles") }}
    WHERE type_mesure = 'vc'
),

join_valeur_initiale_valeur_actuelle as (
    SELECT
        COALESCE(pivot_valeur_initale.indicateur_id, pivot_valeur_actuelle.indicateur_id) as indicateur_id,
        COALESCE(pivot_valeur_initale.zone_id, pivot_valeur_actuelle.zone_id) as zone_id,
        COALESCE(pivot_valeur_initale.date_releve, pivot_valeur_actuelle.date_releve) as date_releve,
        pivot_valeur_initale.indicateur_valeur_initiale,
        pivot_valeur_actuelle.indicateur_valeur_actuelle
    FROM pivot_valeur_initale FULL JOIN pivot_valeur_actuelle
        ON pivot_valeur_initale.indicateur_id = pivot_valeur_actuelle.indicateur_id
               AND pivot_valeur_initale.zone_id = pivot_valeur_actuelle.zone_id
               AND pivot_valeur_initale.date_releve = pivot_valeur_actuelle.date_releve
),

join_valeur_initiale_valeur_actuelle_valeur_cible as (
    SELECT
        COALESCE(pivot_valeur_cible.indicateur_id, join_valeur_initiale_valeur_actuelle.indicateur_id) as indicateur_id,
        COALESCE(pivot_valeur_cible.zone_id, join_valeur_initiale_valeur_actuelle.zone_id) as zone_id,
        COALESCE(pivot_valeur_cible.date_releve, join_valeur_initiale_valeur_actuelle.date_releve) as date_releve,
        join_valeur_initiale_valeur_actuelle.indicateur_valeur_initiale,
        join_valeur_initiale_valeur_actuelle.indicateur_valeur_actuelle,
        pivot_valeur_cible.indicateur_valeur_cible
    FROM pivot_valeur_cible FULL JOIN join_valeur_initiale_valeur_actuelle
        ON pivot_valeur_cible.indicateur_id = join_valeur_initiale_valeur_actuelle.indicateur_id
               AND pivot_valeur_cible.zone_id = join_valeur_initiale_valeur_actuelle.zone_id
               AND pivot_valeur_cible.date_releve = join_valeur_initiale_valeur_actuelle.date_releve
)

SELECT *
FROM join_valeur_initiale_valeur_actuelle_valeur_cible
ORDER BY indicateur_id, zone_id, date_releve
