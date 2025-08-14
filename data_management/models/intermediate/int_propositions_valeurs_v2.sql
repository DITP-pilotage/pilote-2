WITH dernier_evenement_proposition as (
SELECT DISTINCT ON (indic_id, territoire_code, date_valeur)
       *
FROM {{ source('db_schema_public', 'indicateur_territoire_valeur_evenement') }}
WHERE type_evenement IN (
    'PROPOSITION_VALEUR_CREEE',
    'PROPOSITION_VALEUR_MODIFIEE',
    'PROPOSITION_VALEUR_SUPPRIMEE',
    'PROPOSITION_VALEUR_REFUSEE',
    'PROPOSITION_VALEUR_ACCUSEE_RECEPTION',
    'PROPOSITION_VALEUR_ACCEPTEE',
    'PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE',
    'PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE',
    'PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION'
)
ORDER BY indic_id, territoire_code, date_valeur, ordre desc
)
SELECT 
	indic_id,
	date_valeur as date_valeur_avancement,
	zone_id,
	valeur as valeur_avancement_proposee
FROM dernier_evenement_proposition 
LEFT JOIN {{ source('db_schema_public', 'territoire') }} territoire 
    ON territoire.code = dernier_evenement_proposition.territoire_code
WHERE type_evenement in (
    'PROPOSITION_VALEUR_CREEE',
    'PROPOSITION_VALEUR_MODIFIEE',
    'PROPOSITION_VALEUR_ACCUSEE_RECEPTION'
)