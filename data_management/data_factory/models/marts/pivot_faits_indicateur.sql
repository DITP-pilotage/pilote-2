with valeurs_initales_ordonne_par_indicateur_zone_et_date_releve AS (
	SELECT
		ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, zone_id_parent ORDER BY date_releve DESC, date_import DESC) AS row_id,
		indicateur_id,
		zone_id,
		zone_id_parent,
		date_releve AS date_releve_derniere_valeur_initiale
    FROM {{ ref("faits_indicateur")}}
	WHERE type_mesure = 'vi'
),
    
derniere_valeur_initale_par_indicateur_zone_et_date_releve AS (
	SELECT *
	FROM valeurs_initales_ordonne_par_indicateur_zone_et_date_releve
	WHERE row_id = 1
),

faits_indicateur_depuis_la_derniere_vi AS (
	SELECT
		faits_indicateur.*,
		date_releve_derniere_valeur_initiale
	FROM {{ ref("faits_indicateur")}}
	LEFT JOIN derniere_valeur_initale_par_indicateur_zone_et_date_releve
		ON faits_indicateur.indicateur_id = derniere_valeur_initale_par_indicateur_zone_et_date_releve.indicateur_id
	       AND faits_indicateur.zone_id = derniere_valeur_initale_par_indicateur_zone_et_date_releve.zone_id
	       AND faits_indicateur.zone_id_parent = derniere_valeur_initale_par_indicateur_zone_et_date_releve.zone_id_parent
	WHERE date_releve_derniere_valeur_initiale <= date_releve OR date_releve_derniere_valeur_initiale IS null
),

faits_indicateur_order_by_date AS (
    SELECT
        ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, zone_id_parent, type_mesure ORDER BY date_releve DESC, date_import DESC) AS row_id_by_date_releve_desc,
        ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, zone_id_parent, type_mesure ORDER BY date_releve ASC, date_import DESC) AS row_id_by_date_releve_asc,
        *,
        /* dimensions zones */
        case when(zone_type = 'DEPT') then zone_code else NULL end AS departement_code,
        case
            when(zone_type_parent = 'REG') then zone_code_parent
            when(zone_type = 'REG') then zone_code
            else NULL
            end AS region_code,
        'FRANCE' AS national_code
    FROM faits_indicateur_depuis_la_derniere_vi
    ORDER BY indicateur_id, zone_id, zone_id_parent, row_id_by_date_releve_desc
),

premiere_mesure_valeur_actuelle_par_indicateur_et_zone AS (
	SELECT indicateur_id,
		zone_id,
	    zone_id_parent,
		MAX(date_releve) AS date_releve_premiere_mesure_valeur_actuelle,
		MAX(valeur) AS premiere_mesure_valeur_actuelle
	FROM faits_indicateur_order_by_date
	WHERE row_id_by_date_releve_asc = 1 AND type_mesure = 'va'
	GROUP BY indicateur_id, zone_id, zone_id_parent, type_mesure
),

valeurs_actuelles_ordonnees_par_date_de_releve AS (
    SELECT ROW_NUMBER() OVER (PARTITION BY indicateur_id, zone_id, zone_id_parent, date_releve ORDER BY date_releve ASC, date_import DESC) AS row_id,
        *
    FROM {{ ref("faits_indicateur")}}
    WHERE type_mesure = 'va'
),

evolution_indicateur AS (
    SELECT indicateur_id,
        zone_id,
        zone_id_parent,
        array_agg(valeur) AS evolution_valeur_actuelle,
        array_agg(date_releve) AS evolution_date_valeur_actuelle
    FROM valeurs_actuelles_ordonnees_par_date_de_releve
    WHERE row_id = 1
    GROUP BY indicateur_id, zone_id, zone_id_parent
)

SELECT
    faits_indicateur_order_by_date.indicateur_id,
    faits_indicateur_order_by_date.zone_id,
    MAX(faits_indicateur_order_by_date.zone_type) as zone_type,
    faits_indicateur_order_by_date.zone_id_parent,
    MAX(faits_indicateur_order_by_date.zone_type_parent) as zone_type_parent,
    COALESCE(MAX(valeur) FILTER (WHERE type_mesure = 'vi'), MAX(premiere_mesure_valeur_actuelle)) AS valeur_initiale,
    MAX(valeur) FILTER (WHERE type_mesure = 'va') AS valeur_actuelle,
    MAX(valeur) FILTER (WHERE type_mesure = 'vc') AS valeur_cible, -- dernière valeur cible dispo
    COALESCE(MAX(date_releve) FILTER (WHERE type_mesure = 'vi'), MAX(date_releve_premiere_mesure_valeur_actuelle)) AS date_valeur_initiale,
    MAX(date_releve) FILTER (WHERE type_mesure = 'va') AS date_valeur_actuelle,
    MAX(date_releve) FILTER (WHERE type_mesure = 'vc') AS date_valeur_cible, -- dernière valeur cible dispo
    MAX(evolution_indicateur.evolution_valeur_actuelle) AS evolution_valeur_actuelle,
    MAX(evolution_indicateur.evolution_date_valeur_actuelle) AS evolution_date_valeur_actuelle,
    MAX(departement_code) AS departement_code,
    MAX(region_code) AS region_code,
    MAX(national_code) AS national_code
FROM faits_indicateur_order_by_date LEFT JOIN premiere_mesure_valeur_actuelle_par_indicateur_et_zone
	ON faits_indicateur_order_by_date.indicateur_id = premiere_mesure_valeur_actuelle_par_indicateur_et_zone.indicateur_id
               AND faits_indicateur_order_by_date.zone_id = premiere_mesure_valeur_actuelle_par_indicateur_et_zone.zone_id
               AND faits_indicateur_order_by_date.zone_id_parent = premiere_mesure_valeur_actuelle_par_indicateur_et_zone.zone_id_parent
LEFT JOIN evolution_indicateur
    ON faits_indicateur_order_by_date.indicateur_id = evolution_indicateur.indicateur_id
               AND faits_indicateur_order_by_date.zone_id = evolution_indicateur.zone_id
               AND faits_indicateur_order_by_date.zone_id_parent = evolution_indicateur.zone_id_parent
WHERE row_id_by_date_releve_desc = 1
GROUP BY faits_indicateur_order_by_date.indicateur_id, faits_indicateur_order_by_date.zone_id, faits_indicateur_order_by_date.zone_id_parent
