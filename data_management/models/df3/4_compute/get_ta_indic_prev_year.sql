SELECT 
    -- *,
	indic_id,
	zone_id, 
    --taa_courant as taa_prev_year,
	taa_adate as taa_prev_year,
	tag as tag_prev_year ,
	vaca as valeur_actuelle_prev_year,
	date_valeur_actuelle::date as date_valeur_actuelle_prev_year,
	vca_adate,
	vca_adate_date,
	vacp,
	tap_global,
	tap_courant
FROM {{ ref('get_last_vaca_prev_year') }}
