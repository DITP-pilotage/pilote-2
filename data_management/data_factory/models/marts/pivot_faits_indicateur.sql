with faits_indicateur_order_by_date as (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY indic_id, zone_id, metric_type ORDER BY metric_date ASC) AS row_id,
        *,
        /* dimensions zones */
        case when(zone_type like 'DEPT') then zone_code else NULL end as departement_code,
        case
            when(zone_type_parent = 'REG') then zone_code_parent
            when(zone_type_parent = 'FRANCE') then zone_code
            else NULL
            end as region_code,
        'FRANCE' as national_code
    FROM {{ ref("faits_indicateur")}}
    ORDER BY indicateur_id, zone_id, row_id
)

SELECT
    indicateur_id,
    zone_id,
    LAST(metric_value) FILTER (where metric_type = 'vi') as valeur_initiale,
    COALESCE(LAST(metric_value) FILTER (where metric_type = 'va'), valeur_initiale) as valeur_actuelle,
    LAST(metric_value) FILTER (where metric_type = 'vc') as valeur_cible,
    LAST(metric_date) FILTER (where metric_type = 'vi') as date_valeur_initiale,
    LAST(metric_date) FILTER (where metric_type = 'va') as date_valeur_actuelle,
    LAST(metric_date) FILTER (where metric_type = 'vc') as date_valeur_cible,
    ANY_VALUE(departement_code) as departement_code,
    ANY_VALUE(region_code) as region_code,
    ANY_VALUE(national_code) as national_code,
FROM faits_indicateur_order_by_date
GROUP BY indicateur_id, zone_id
