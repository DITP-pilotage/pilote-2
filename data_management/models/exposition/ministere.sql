SELECT id,
       acronyme, 
       nom_court as nom,
       icone,
       false AS a_supprimer
FROM {{ ref('stg_ppg_metadata__porteurs') }}
WHERE porteur_type_acronyme = 'MIN'
