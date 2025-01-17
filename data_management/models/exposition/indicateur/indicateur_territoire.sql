{{ config(
    materialized = 'incremental', 
    unique_key = ['id', 'territoire_code'])
}}


-- Reformattage (pour chaque indicateur-zone):
--	- Retourne au format [{date: "YYYY-MM-DD", valeur: 12.34}]
WITH 
get_evol_vaca as (
	select 
	indic_id, zone_id,
	jsonb_agg(jsonb_build_object(
		'date',metric_date,
		'valeur',vaca)) AS evolution_valeur_actuelle
	from {{ ref('compute_ta_indic') }}
	where vaca is not null
	group by indic_id, zone_id
)

SELECT 
    meta_indic.id AS id,
	territoire.maille as maille,
	territoire.code as territoire_code,
	territoire.code_insee as code_insee,
	territoire.zone_id as zone_id,
	gvcg.vcg as valeur_cible_mandat,
	CASE 
		WHEN 
			-- Nous sommes après la date de bascule, afficher TA de l'année courante
			date_bascule.date_depassee THEN a.tag
		    -- Nous sommes après la date de bascule, afficher TA de l'année précédente
		ELSE a_prev_year.tag_prev_year
	END as taux_avancement_mandat,
	CASE 
		WHEN 
			-- Nous sommes après la date de bascule, afficher TA de l'année courante
			date_bascule.date_depassee THEN a.date_valeur_actuelle::date
		-- Nous sommes après la date de bascule, afficher TA de l'année précédente
		ELSE a_prev_year.date_valeur_actuelle_prev_year
	END as date_valeur_actuelle,
	gvig.vig_date::date as date_valeur_initiale,
	CASE 
		WHEN 
			-- Nous sommes après la date de bascule, afficher TA de l'année courante
			date_bascule.date_depassee THEN a.vaca
		-- Nous sommes après la date de bascule, afficher TA de l'année précédente
		ELSE a_prev_year.valeur_actuelle_prev_year
	END as valeur_actuelle,
	gvig.vig as valeur_initiale,
	territoire.nom as territoire_nom,
	gvcg.vcg_date::date as date_valeur_cible_mandat,
    COALESCE(z_appl.est_applicable, TRUE) AS est_applicable,
	pond_reelle.poids_zone_declaree as ponderation_zone_declaree,
	pond_reelle.poids_zone_reel as ponderation_zone_reel,
	CASE 
		WHEN COALESCE(z_appl.est_applicable, true) THEN date_pro_maj.est_a_jour 
		ELSE NULL 
	END AS est_a_jour,
	-- Si l'indic n'est pas applicable sur la zone, prochaine_date_maj=NULL
	--	peu importe la date calculée pour la maille correspondant à cette zone
	CASE 
		WHEN COALESCE(z_appl.est_applicable, true) THEN date_pro_maj.prochaine_date_maj 
		ELSE NULL 
	END AS prochaine_date_maj,
	CASE 
		WHEN COALESCE(z_appl.est_applicable, true) THEN date_pro_maj.prochaine_date_maj_jours 
		ELSE NULL
	END AS prochaine_date_maj_jours,
	meta_indic_parametrage.tendance AS tendance,
	CASE 
		WHEN date_bascule.date_depassee THEN a.vacp
		ELSE a_prev_year.vacp
	END as valeur_actuelle_proposition,
	CASE 
		WHEN 
			date_bascule.date_depassee THEN pva.auteur_proposition
		ELSE pva_prev_year.auteur_proposition
	END as auteur_proposition,
	CASE 
		WHEN 
			date_bascule.date_depassee THEN pva.date_proposition::date
		ELSE pva_prev_year.date_proposition::date
	END as date_proposition,
	CASE 
		WHEN 
			date_bascule.date_depassee THEN pva.motif_proposition
		ELSE pva_prev_year.motif_proposition
	END as motif_proposition,
	CASE 
		WHEN 
			date_bascule.date_depassee THEN pva.source_donnee_methode_calcul
		ELSE pva_prev_year.source_donnee_methode_calcul
	END as source_donnee_methode_calcul_proposition,
	CASE 
		WHEN date_bascule.date_depassee THEN a.tap_global
		ELSE a_prev_year.tap_global
	END as taux_avancement_mandat_proposition,
	CASE 
		WHEN COALESCE(z_appl.est_applicable, true) THEN date_pro_maj.prochaine_date_va 
		ELSE NULL 
	END AS prochaine_date_valeur_actuelle,
	COALESCE(
		evol_va.evolution_valeur_actuelle,
		'[]'::jsonb	-- Return [] if the join gives NULL
	) as evolution_valeur_actuelle

	--, TODO: le reste des colonnes
FROM {{ source('db_schema_public', 'territoire') }} territoire
CROSS JOIN {{ ref('stg_ppg_metadata__indicateurs') }} meta_indic
LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} meta_zone ON meta_zone.id = territoire.zone_id 
LEFT JOIN {{ ref('get_vcg') }} gvcg ON meta_indic.id=gvcg.indic_id AND territoire.zone_id=gvcg.zone_id
CROSS JOIN {{ ref('get_date_bascule_depassee') }} as date_bascule
LEFT JOIN {{ ref('get_last_vaca') }} a ON a.indic_id = meta_indic.id AND a.zone_id = territoire.zone_id
LEFT JOIN {{ ref('get_ta_indic_prev_year') }} a_prev_year ON a_prev_year.indic_id = meta_indic.id AND a_prev_year.zone_id=territoire.zone_id
LEFT JOIN {{ ref('get_vig') }} gvig on meta_indic.id=gvig.indic_id and territoire.zone_id=gvig.zone_id
LEFT JOIN {{ ref('int_indicateurs_zones_applicables') }} z_appl ON z_appl.indic_id = meta_indic.id AND z_appl.zone_id = territoire.zone_id
LEFT JOIN {{ ref('int_ponderation_reelle') }} pond_reelle ON pond_reelle.indic_id=meta_indic.id and pond_reelle.zone_id=territoire.zone_id
LEFT JOIN {{ ref('get_date_pro_maj_indic') }} as date_pro_maj ON meta_indic.id=date_pro_maj.indic_id and meta_zone.maille =date_pro_maj."maille"
-- TODO: create stg table for this
LEFT JOIN {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} meta_indic_parametrage on meta_indic.id = meta_indic_parametrage.indic_id 
LEFT JOIN {{ ref('int_propositions_valeurs') }} pva on pva.indic_id = meta_indic.id and pva.territoire_code = territoire.code and pva.date_valeur_actuelle::DATE = a.date_valeur_actuelle::DATE
LEFT JOIN {{ ref('int_propositions_valeurs') }} pva_prev_year on pva_prev_year.indic_id = meta_indic.id and pva_prev_year.territoire_code = territoire.code and pva_prev_year.date_valeur_actuelle::DATE = a.date_valeur_actuelle::DATE
LEFT JOIN get_evol_vaca AS evol_va on meta_indic.id=evol_va.indic_id and territoire.zone_id=evol_va.zone_id


ORDER BY meta_indic.id, territoire.maille, territoire.code
