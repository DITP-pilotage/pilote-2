SELECT
    id,
    nom,
    ministere_nom as ministere,
    ministere_id,
    false AS a_supprimer
FROM "dev_pilote__6230"."raw_data"."stg_ppg_metadata__perimetres"
WHERE ministere_id is not null