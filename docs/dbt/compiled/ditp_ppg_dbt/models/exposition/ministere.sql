SELECT
    id,
    acronyme,
    nom,
    icone,
    FALSE AS a_supprimer
FROM "dev_pilote__6230"."raw_data"."stg_ppg_metadata__porteurs"
WHERE porteur_type_acronyme = 'MIN'