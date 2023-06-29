WITH taux_avancement_indicateur as (
    SELECT
        pivot.*,
		CASE
			WHEN (parametrage.tendance = 'HAUSSE' OR parametrage.tendance IS NULL)
			    AND pivot.valeur_initiale >= pivot.valeur_cible_annuelle AND pivot.valeur_actuelle_comparable_annuelle >= pivot.valeur_cible_annuelle
			    THEN 100
			WHEN (parametrage.tendance = 'HAUSSE' OR parametrage.tendance IS NULL)
			    AND pivot.valeur_initiale >= pivot.valeur_cible_annuelle AND pivot.valeur_actuelle_comparable_annuelle < pivot.valeur_cible_annuelle
			    THEN 0
			WHEN parametrage.tendance = 'BAISSE'
			    AND pivot.valeur_initiale <= pivot.valeur_cible_annuelle AND pivot.valeur_actuelle_comparable_annuelle <= pivot.valeur_cible_annuelle
			    THEN 100
			WHEN parametrage.tendance = 'BAISSE'
			    AND pivot.valeur_initiale <= pivot.valeur_cible_annuelle AND pivot.valeur_actuelle_comparable_annuelle > pivot.valeur_cible_annuelle
			    THEN 0
			ELSE 100 * (pivot.valeur_actuelle_comparable_annuelle - pivot.valeur_initiale) / (pivot.valeur_cible_annuelle - pivot.valeur_initiale)
        END AS taux_avancement_annuel,
        CASE
			WHEN (parametrage.tendance = 'HAUSSE' OR parametrage.tendance IS NULL)
			    AND pivot.valeur_initiale >= pivot.valeur_cible_globale AND pivot.valeur_actuelle_comparable_globale >= pivot.valeur_cible_globale
			    THEN 100
			WHEN (parametrage.tendance = 'HAUSSE' OR parametrage.tendance IS NULL)
			    AND pivot.valeur_initiale >= pivot.valeur_cible_globale AND pivot.valeur_actuelle_comparable_globale < pivot.valeur_cible_globale
			    THEN 0
			WHEN parametrage.tendance = 'BAISSE'
			    AND pivot.valeur_initiale <= pivot.valeur_cible_globale AND pivot.valeur_actuelle_comparable_globale <= pivot.valeur_cible_globale
			    THEN 100
			WHEN parametrage.tendance = 'BAISSE'
			    AND pivot.valeur_initiale <= pivot.valeur_cible_globale AND pivot.valeur_actuelle_comparable_globale > pivot.valeur_cible_globale
			    THEN 0
			ELSE 100 * (pivot.valeur_actuelle_comparable_globale - pivot.valeur_initiale) / (pivot.valeur_cible_globale - pivot.valeur_initiale)
        END AS taux_avancement_globale
    FROM {{ ref('pivot_faits_indicateur_avec_valeur_actuelle_comparable')}} pivot
        JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs')}} parametrage ON pivot.indicateur_id = parametrage.indicateur_id
)

SELECT
    *,
    CASE
        WHEN taux_avancement_annuel IS NOT NULL
            THEN GREATEST(LEAST(taux_avancement_annuel, 100), 0)
        ELSE NULL
    END AS taux_avancement_annuel_borne,
    CASE
        WHEN taux_avancement_globale IS NOT NULL
            THEN GREATEST(LEAST(taux_avancement_globale, 100), 0)
        ELSE NULL
    END AS taux_avancement_globale_borne
FROM taux_avancement_indicateur
