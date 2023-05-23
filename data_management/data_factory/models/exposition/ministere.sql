SELECT id,
       nom,
       icone
FROM {{ ref('stg_ppg_metadata__porteurs') }}
WHERE porteur_type_polygramme = 'MIN'
