SELECT 
    -- *,
	indic_id,
	zone_id, 
    --taa_courant as taa_prev_year,
	taa_prev_year as taa_prev_year,
	tag as tag_prev_year ,
	vaca as valeur_actuelle_prev_year,
	date_valeur_actuelle::date as date_valeur_actuelle_prev_year,
	vca_prev_year,
	vca_prev_year_date,
	vacp,
	tap_global,
	tap_courant,
	tap_adate
FROM {{ ref('get_last_vaca_prev_year') }}
