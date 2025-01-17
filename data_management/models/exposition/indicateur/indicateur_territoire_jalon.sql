 -- depends_on: {{ ref('indicateur_territoire') }}

{{ config(
    materialized = 'incremental', 
    unique_key = ['id', 'territoire_code', 'jalon'])
}}

WITH

jalon_annee_precedente as (
	select 
	indic_id, zone_id,
    date_part('year', now()) - 1 AS jalon,
	vca_prev_year_date,
	taa_prev_year,
	vca_prev_year,
	tap_courant
	 from {{ ref('get_ta_indic_prev_year') }}
),

jalon_annee_courante_pt1 as (
	SELECT 
		indic_id, zone_id,
        date_part('year', now()) AS jalon,
	vca_date,
	vca
        FROM {{ ref('get_vca') }}
        WHERE yyear = (date_part('year', now()))
),

jalon_annee_courante_pt2 as (
	SELECT 
		indic_id, zone_id,
        date_part('year', now()) AS jalon,
	taa_courant,
	tap_courant
        FROM {{ ref('get_last_vaca') }}
),

-- Les jalons à considerer: ici année en cours et année précédente.
jalons_a_considerer AS (
    SELECT (date_part('year', now())) AS jalon
    UNION
    SELECT (date_part('year', now()) - 1) AS jalon
)

SELECT
    meta_indic.id,
    territoire.code AS territoire_code,
    territoire.code_insee,
    territoire.maille,
    jalons.jalon AS jalon,
    territoire.zone_id,
    CASE
        WHEN
            -- Nous sommes après la date de bascule, afficher TA de l'année courante
            date_bascule.date_depassee THEN gvca.vca_date::date
        -- Nous sommes après la date de bascule, afficher TA de l'année précédente
        ELSE a_prev_year.vca_prev_year_date::date
    END AS date_valeur_cible,
	CASE 
		WHEN 
			-- Nous sommes après la date de bascule, afficher TA de l'année courante
			date_bascule.date_depassee THEN a.taa_courant
		-- Nous sommes après la date de bascule, afficher TA de l'année précédente
		ELSE a_prev_year.taa_prev_year
	END as taux_avancement,
	CASE 
		WHEN 
			-- Nous sommes après la date de bascule, afficher TA de l'année courante
			date_bascule.date_depassee THEN gvca.vca
		-- Nous sommes après la date de bascule, afficher TA de l'année précédente
		ELSE a_prev_year.vca_prev_year
	END as valeur_cible,
	CASE 
		WHEN date_bascule.date_depassee THEN a.tap_courant
		ELSE a_prev_year.tap_courant
	END as taux_avancement_proposition
FROM {{ source('db_schema_public', 'territoire') }} AS territoire
CROSS JOIN {{ ref('stg_ppg_metadata__indicateurs') }} AS meta_indic
CROSS JOIN {{ ref('get_date_bascule_depassee') }} AS date_bascule
CROSS JOIN jalons_a_considerer as jalons
LEFT JOIN jalon_annee_courante_pt2 a on a.indic_id=meta_indic.id and a.zone_id=territoire.zone_id
--LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} 
LEFT JOIN jalon_annee_courante_pt1 AS gvca
    ON meta_indic.id = gvca.indic_id AND territoire.zone_id = gvca.zone_id
LEFT JOIN
    jalon_annee_precedente AS a_prev_year
    ON
        meta_indic.id = a_prev_year.indic_id
        AND territoire.zone_id = a_prev_year.zone_id and a_prev_year.jalon=jalons.jalon

