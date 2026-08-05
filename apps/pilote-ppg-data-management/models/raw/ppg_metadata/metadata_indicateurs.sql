SELECT
    metadata_hidden.*,
    metadata_complementaire.indic_territorialise,
    metadata_complementaire.mailles
FROM
    {{ source('ppg_metadata', 'metadata_indicateurs_hidden') }}
        AS metadata_hidden
LEFT JOIN
    {{ source('ppg_metadata', 'metadata_indicateurs_complementaire') }} -- noqa: LT05
        AS metadata_complementaire
    ON metadata_hidden.indic_id = metadata_complementaire.indic_id
