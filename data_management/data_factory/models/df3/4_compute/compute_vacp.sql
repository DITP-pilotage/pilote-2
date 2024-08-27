SELECT 
	indic_id,
	ipv.date_valeur_actuelle::DATE::TEXT AS metric_date,
	zone_id,
	ipv.valeur_actuelle_proposee as vacp
FROM
	{{ ref('int_propositions_valeurs') }}  ipv
LEFT JOIN 
	{{ source('db_schema_public', 'territoire') }} t
	ON t.code = ipv.territoire_code