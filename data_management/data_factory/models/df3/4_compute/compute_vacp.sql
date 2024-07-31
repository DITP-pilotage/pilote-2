WITH ranked_propositions AS (
	SELECT 
	    pva.indic_id,
	    pva.date_valeur_actuelle::DATE::TEXT AS metric_date,
	    zones.id AS zone_id,
	    pva.valeur_actuelle_proposee AS vacp,
	    ROW_NUMBER() OVER (PARTITION BY pva.indic_id, pva.territoire_code, pva.date_valeur_actuelle ORDER BY pva.date_proposition DESC) AS rang
	FROM 
	    {{ source('db_schema_public', 'proposition_valeur_actuelle') }} pva
	LEFT JOIN 
	    {{ ref('stg_ppg_metadata__zones') }} zones
	    ON pva.territoire_code = CONCAT(zones.maille, '-', zones.code_insee)
	WHERE
	    pva.statut = 'EN_COURS'
)
SELECT 
	indic_id,
	metric_date,
	zone_id,
	vacp
FROM ranked_propositions
WHERE rang = 1