{{ config(pre_hook="{{ drop_indic_just_hidden(this) }}") }}

SELECT 
    metadata_hidden.*,
    metadata_complementaire.indic_territorialise,
    metadata_complementaire.mailles
FROM {{ source('parametrage_indicateurs', 'metadata_indicateurs_hidden') }} AS metadata_hidden
LEFT JOIN {{ source('parametrage_indicateurs', 'metadata_indicateurs_complementaire') }} AS metadata_complementaire
    ON metadata_hidden.indic_id = metadata_complementaire.indic_id 
WHERE NOT COALESCE(indic_hidden_pilote::text::boolean, FALSE)
