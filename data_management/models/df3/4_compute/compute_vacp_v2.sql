SELECT 
	indic_id,
	date_valeur_avancement::DATE::TEXT AS metric_date,
	zone_id,
	valeur_avancement_proposee as vacp
FROM
	{{ ref('int_propositions_valeurs_v2') }}