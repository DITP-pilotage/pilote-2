SELECT 
    metadata_hidden.*,
    metadata_complementaire.indic_territorialise,
    metadata_complementaire.mailles
FROM "dev_pilote__6230"."raw_data"."metadata_indicateurs_hidden" AS metadata_hidden
LEFT JOIN "dev_pilote__6230"."raw_data"."metadata_indicateurs_complementaire" AS metadata_complementaire
    ON metadata_hidden.indic_id = metadata_complementaire.indic_id