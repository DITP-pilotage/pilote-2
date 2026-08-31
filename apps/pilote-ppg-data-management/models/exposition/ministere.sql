SELECT
    id,
    acronyme,
    nom,
    icone,
    FALSE AS a_supprimer
FROM {{ ref('stg_ppg_metadata__porteurs') }}
WHERE porteur_type_acronyme = 'MIN'
