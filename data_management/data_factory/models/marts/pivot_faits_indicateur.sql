with faits_indicateur_order_by_date as (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, type_mesure ORDER BY date_releve DESC) AS row_id,
        *,
        /* dimensions zones */
        case when(zone_type = 'DEPT') then zone_code else NULL end as departement_code,
        case
            when(zone_type_parent = 'REG') then zone_code_parent
            when(zone_type = 'REG') then zone_code
            else NULL
            end as region_code,
        'FRANCE' as national_code
    FROM {{ ref("faits_indicateur")}}
    ORDER BY indicateur_id, zone_id, row_id
)

SELECT
    indicateur_id,
    zone_id,
    MAX(valeur) FILTER (where type_mesure = 'vi') as valeur_initiale,
    COALESCE(MAX(valeur) FILTER (where type_mesure = 'va'), MAX(valeur) FILTER (where type_mesure = 'vi')) as valeur_actuelle,
    MAX(valeur) FILTER (where type_mesure = 'vc') as valeur_cible, -- dernière valeur cible dispo
    MAX(date_releve) FILTER (where type_mesure = 'vi') as date_valeur_initiale,
    MAX(date_releve) FILTER (where type_mesure = 'va') as date_valeur_actuelle,
    MAX(date_releve) FILTER (where type_mesure = 'vc') as date_valeur_cible, -- dernière valeur cible dispo
    MAX(departement_code) as departement_code,
    MAX(region_code) as region_code,
    MAX(national_code) as national_code
FROM faits_indicateur_order_by_date
WHERE row_id = 1
GROUP BY indicateur_id, zone_id
