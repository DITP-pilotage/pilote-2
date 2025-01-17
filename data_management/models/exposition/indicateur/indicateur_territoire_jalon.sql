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
	vca_prev_year_date::date AS date_valeur_cible,
	taa_prev_year as taux_avancement,
	vca_prev_year as valeur_cible,
	tap_courant as taux_avancement_proposition
	 from {{ ref('get_ta_indic_prev_year') }}
),

jalon_annee_courante as (
	SELECT
		meta_indic.id AS indic_id,
		territoire.zone_id AS zone_id,
        date_part('year', now()) AS jalon,
		pt1.vca_date::date as date_valeur_cible,
		pt1.vca as valeur_cible,
		pt2.taa_courant as taux_avancement,
		pt2.tap_courant as taux_avancement_proposition
	FROM {{ source('db_schema_public', 'territoire') }} AS territoire
	CROSS JOIN {{ ref('stg_ppg_metadata__indicateurs') }} AS meta_indic
	LEFT JOIN {{ ref('get_vca') }} AS pt1 on pt1.indic_id=meta_indic.id and pt1.zone_id=territoire.zone_id
	LEFT JOIN {{ ref('get_last_vaca') }} AS pt2 on pt2.indic_id=meta_indic.id and pt2.zone_id=territoire.zone_id
    WHERE pt1.yyear = (date_part('year', now()))
),

-- Tous les TA pour tous les jalons
jalon_annee_precedente_et_courante AS (
    SELECT * FROM jalon_annee_precedente
    UNION
    SELECT * FROM jalon_annee_courante
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
    tous_jalons.date_valeur_cible,
    tous_jalons.taux_avancement,
    tous_jalons.valeur_cible,
    tous_jalons.taux_avancement_proposition
FROM {{ source('db_schema_public', 'territoire') }} AS territoire
CROSS JOIN {{ ref('stg_ppg_metadata__indicateurs') }} AS meta_indic
CROSS JOIN {{ ref('get_date_bascule_depassee') }} AS date_bascule
CROSS JOIN jalons_a_considerer as jalons
LEFT JOIN
    jalon_annee_precedente_et_courante AS tous_jalons
    ON territoire.zone_id = tous_jalons.zone_id AND meta_indic.id = tous_jalons.indic_id AND jalons.jalon=tous_jalons.jalon
