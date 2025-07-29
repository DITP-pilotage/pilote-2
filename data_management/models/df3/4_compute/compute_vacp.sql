SELECT 
	indic_id,
	date_valeur_actuelle::DATE::TEXT AS metric_date,
	zone_id,
	valeur_actuelle_proposee as vacp
FROM
	{{ ref('int_propositions_valeurs') }}
