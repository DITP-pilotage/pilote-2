{{ config(
    materialized = 'table', 
    unique_key = ['id', 'territoire_code'])
}}
-- config WIP: table -> incremental

SELECT 
    meta_indic.id AS id,
	territoire.maille as maille,
	territoire.code as territoire_code,
	gvcg.vcg as valeur_cible_mandat,
	CASE 
		WHEN 
			-- Nous sommes après la date de bascule, afficher TA de l'année courante
			date_bascule.date_depassee THEN a.tag
		    -- Nous sommes après la date de bascule, afficher TA de l'année précédente
		ELSE a_prev_year.tag_prev_year
	END as taux_avancement_mandat
	--, TODO: le reste des colonnes
FROM {{ source('db_schema_public', 'territoire') }} territoire
CROSS JOIN {{ ref('stg_ppg_metadata__indicateurs') }} meta_indic
LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} meta_zone ON meta_zone.id = territoire.zone_id 
LEFT JOIN {{ ref('get_vcg') }} gvcg ON meta_indic.id=gvcg.indic_id AND meta_zone.id=gvcg.zone_id
CROSS JOIN {{ ref('get_date_bascule_depassee') }} as date_bascule
LEFT JOIN {{ ref('get_last_vaca') }} a ON a.indic_id = meta_indic.id AND a.zone_id = territoire.zone_id
LEFT JOIN {{ ref('get_ta_indic_prev_year') }} a_prev_year ON a_prev_year.indic_id = meta_indic.id AND a_prev_year.zone_id=territoire.zone_id


ORDER BY meta_indic.id, territoire.maille, territoire.code
