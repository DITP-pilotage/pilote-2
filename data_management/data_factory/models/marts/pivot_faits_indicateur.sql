with valeurs_initales_ordonne_par_indicateur_zone_et_date_releve as (
	SELECT
		ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, zone_id_parent ORDER BY date_releve DESC) AS row_id,
		indicateur_id,
		zone_id,
		zone_id_parent,
		date_releve
    FROM {{ ref("faits_indicateur")}}
	WHERE zone_id_parent not like 'A%' and type_mesure = 'vi'
),
    
valeur_initale_par_indicateur_zone_et_date_releve as (
	SELECT
		indicateur_id,
		zone_id,
		zone_id_parent,
		date_releve as date_releve_derniere_valeur_initiale
	FROM valeurs_initales_ordonne_par_indicateur_zone_et_date_releve
	WHERE row_id = 1
),

faits_indicateur_reduit as (
	SELECT
		faits_indicateur.*,
		date_releve_derniere_valeur_initiale
	FROM {{ ref("faits_indicateur")}}
	left join valeur_initale_par_indicateur_zone_et_date_releve
		ON faits_indicateur.indicateur_id = valeur_initale_par_indicateur_zone_et_date_releve.indicateur_id
	       AND faits_indicateur.zone_id = valeur_initale_par_indicateur_zone_et_date_releve.zone_id
	       AND faits_indicateur.zone_id_parent = valeur_initale_par_indicateur_zone_et_date_releve.zone_id_parent
	WHERE date_releve_derniere_valeur_initiale <= date_releve or date_releve_derniere_valeur_initiale is null
),

faits_indicateur_order_by_date as (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, zone_id_parent, type_mesure ORDER BY date_releve DESC) AS row_id_by_date_releve_desc,
        ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, zone_id_parent, type_mesure ORDER BY date_releve ASC) AS row_id_by_date_releve_asc,
        *,
        /* dimensions zones */
        case when(zone_type = 'DEPT') then zone_code else NULL end as departement_code,
        case
            when(zone_type_parent = 'REG') then zone_code_parent
            when(zone_type = 'REG') then zone_code
            else NULL
            end as region_code,
        'FRANCE' as national_code
    FROM faits_indicateur_reduit
    ORDER BY indicateur_id, zone_id, zone_id_parent, row_id_by_date_releve_desc
),

premiere_mesure_valeur_actuelle_par_indicateur_et_zone as (
	SELECT indicateur_id,
		zone_id,
	    zone_id_parent,
		MAX(date_releve) as date_releve_premiere_mesure_valeur_actuelle,
		MAX(valeur) as premiere_mesure_valeur_actuelle
	FROM faits_indicateur_order_by_date
	WHERE row_id_by_date_releve_asc = 1 and type_mesure = 'va'
	group BY indicateur_id, zone_id, zone_id_parent, type_mesure
)

SELECT
    faits_indicateur_order_by_date.indicateur_id,
    faits_indicateur_order_by_date.zone_id,
    faits_indicateur_order_by_date.zone_id_parent,
    COALESCE(MAX(valeur) FILTER (WHERE type_mesure = 'vi'), MAX(premiere_mesure_valeur_actuelle)) as valeur_initiale,
    MAX(valeur) FILTER (WHERE type_mesure = 'va') as valeur_actuelle,
    MAX(valeur) FILTER (WHERE type_mesure = 'vc') as valeur_cible, -- dernière valeur cible dispo
    COALESCE(MAX(date_releve) FILTER (WHERE type_mesure = 'vi'), MAX(date_releve_premiere_mesure_valeur_actuelle)) as date_valeur_initiale,
    MAX(date_releve) FILTER (WHERE type_mesure = 'va') as date_valeur_actuelle,
    MAX(date_releve) FILTER (WHERE type_mesure = 'vc') as date_valeur_cible, -- dernière valeur cible dispo
    MAX(departement_code) as departement_code,
    MAX(region_code) as region_code,
    MAX(national_code) as national_code
FROM faits_indicateur_order_by_date left join premiere_mesure_valeur_actuelle_par_indicateur_et_zone
	ON faits_indicateur_order_by_date.indicateur_id = premiere_mesure_valeur_actuelle_par_indicateur_et_zone.indicateur_id
               AND faits_indicateur_order_by_date.zone_id = premiere_mesure_valeur_actuelle_par_indicateur_et_zone.zone_id
               AND faits_indicateur_order_by_date.zone_id_parent = premiere_mesure_valeur_actuelle_par_indicateur_et_zone.zone_id_parent
WHERE row_id_by_date_releve_desc = 1
GROUP BY faits_indicateur_order_by_date.indicateur_id, faits_indicateur_order_by_date.zone_id, faits_indicateur_order_by_date.zone_id_parent
