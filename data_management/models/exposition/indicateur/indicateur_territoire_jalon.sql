-- depends_on: {{ ref('indicateur_territoire') }}

{{ config(
    materialized = 'incremental', 
    unique_key = ['id', 'territoire_code', 'jalon'])
}}

WITH

jalon_annee_precedente AS (
    SELECT
        indic_id,
        zone_id,
        date_part('year', now()) - 1 AS jalon,
        vca_prev_year_date::date AS date_valeur_cible,
        vca_prev_year AS valeur_cible,
        taa_prev_year AS taux_avancement,
        tap_adate AS taux_avancement_proposition,
        date_valeur_actuelle_prev_year::date AS date_valeur_actuelle,
        valeur_actuelle_prev_year AS valeur_actuelle
    FROM {{ ref('get_ta_indic_prev_year') }}
),

jalon_annee_courante AS (
    SELECT
        meta_indic.id AS indic_id,
        territoire.zone_id,
        date_part('year', now()) AS jalon,
        pt1.vca_date::date AS date_valeur_cible,
        pt1.vca AS valeur_cible,
        pt2.taa_courant AS taux_avancement,
        pt2.tap_courant AS taux_avancement_proposition,
        pt2.date_valeur_actuelle::date AS date_valeur_actuelle,
        pt2.vaca AS valeur_actuelle
    FROM {{ source('db_schema_public', 'territoire') }} AS territoire
    CROSS JOIN {{ ref('stg_ppg_metadata__indicateurs') }} AS meta_indic
    LEFT JOIN
        {{ ref('get_vca') }} AS pt1
        ON meta_indic.id = pt1.indic_id AND territoire.zone_id = pt1.zone_id and pt1.yyear=date_part('year', now())
    LEFT JOIN
        {{ ref('get_last_vaca') }} AS pt2
        ON meta_indic.id = pt2.indic_id AND territoire.zone_id = pt2.zone_id and date_part('year', pt2.date_valeur_actuelle::date) = (date_part('year', now()))
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
    tous_jalons.indic_id AS id,
    territoire.code AS territoire_code,
    territoire.code_insee,
    territoire.maille,
    jalons.jalon,
    territoire.zone_id,
    tous_jalons.date_valeur_cible,
    tous_jalons.taux_avancement,
    tous_jalons.valeur_cible,
    tous_jalons.taux_avancement_proposition,
    tous_jalons.date_valeur_actuelle,
    tous_jalons.valeur_actuelle
FROM jalon_annee_precedente_et_courante AS tous_jalons
LEFT JOIN {{ source('db_schema_public', 'territoire') }} AS territoire
    ON tous_jalons.zone_id = territoire.zone_id
RIGHT JOIN jalons_a_considerer AS jalons ON tous_jalons.jalon = jalons.jalon
