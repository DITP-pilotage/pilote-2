SELECT
    id,
    nom,
    false AS a_supprimer
FROM "dev_pilote__6230"."raw_data"."stg_ppg_metadata__axes"
WHERE nom is not null