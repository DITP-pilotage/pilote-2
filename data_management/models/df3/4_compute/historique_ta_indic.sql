WITH valeurs_ordonnees AS (
	SELECT
		id,
		metric_date,
		indic_id,
		zone_id,
		RANK() OVER (
			PARTITION BY
				indic_id,
				zone_id
			ORDER BY metric_date ASC
		) AS rang
	FROM {{ ref('merge_computed_values') }} AS valeurs
	WHERE valeurs.vaca IS NOT NULL
), 

jalons_pour_lesquels_calculer_ta AS (
	SELECT
		valeur.id,
		EXTRACT(YEAR FROM GENERATE_SERIES(
				DATE_TRUNC('year', valeur.metric_date),
				DATE_TRUNC('year', COALESCE(valeur_suivante.metric_date, NOW())),
				INTERVAL '1 year'
			)
		) AS jalon
	FROM valeurs_ordonnees AS valeur
	LEFT OUTER JOIN valeurs_ordonnees AS valeur_suivante
		ON valeur.indic_id = valeur_suivante.indic_id
			AND valeur.zone_id = valeur_suivante.zone_id
			AND valeur_suivante.rang = valeur.rang + 1
),

ta AS (
	SELECT
		valeurs.id,
		valeurs.metric_date,
		valeurs.indic_id,
		valeurs.zone_id,
		valeurs.vaca,
		cibles.vca,
		valeurs.vig,
		jalons_pour_lesquels_calculer_ta.jalon,
		{{ compute_ta_macro('valeurs.vig', 'cibles.vca', 'valeurs.vaca', 'indicateurs.tendance') }} AS ta
	FROM {{ ref('merge_computed_values') }} AS valeurs
	LEFT OUTER JOIN {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} AS indicateurs
		ON valeurs.indic_id = indicateurs.indic_id
	LEFT OUTER JOIN jalons_pour_lesquels_calculer_ta
		ON valeurs.id = jalons_pour_lesquels_calculer_ta.id
	LEFT OUTER JOIN {{ ref('get_vca_jalon') }} AS cibles
		ON jalons_pour_lesquels_calculer_ta.jalon = cibles.jalon
			AND valeurs.zone_id = cibles.zone_id
			AND valeurs.indic_id = cibles.indic_id
),

ta_encadre AS (
	SELECT
		ta.*,
		CASE 
			WHEN ta.ta IS NULL 
				THEN NULL
			ELSE GREATEST(LEAST(ta.ta, 100), 0)::NUMERIC
		END AS ta_encadre
	FROM ta
),

mois_historique AS (
	SELECT
		GENERATE_SERIES(
			'{{ var('premier_jalon_va') }}-01-01 00:00'::DATE,
			DATE_TRUNC('month', now()), '1 month'
		)::DATE AS snapshot_month
)


SELECT
	*
FROM ta_encadre
