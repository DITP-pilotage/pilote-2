SELECT
    {{ dbt_utils.generate_surrogate_key(
                 ['commentaires.chantier_id',
                 'commentaires.type',
                 'commentaires.date']
             ) }} AS id,
    commentaires."date" AS date_creation,
    COALESCE(
        utilisateur.id,
        utilisateur_import.id
    )::UUID AS auteur_creation_id,
    commentaires."date" AS date_modification,
    COALESCE(
        utilisateur.id,
        utilisateur_import.id
    )::UUID AS auteur_modification_id,
    commentaires."type"::TYPE_OBJECTIF,
    commentaires.contenu,
    NULL::VARCHAR AS contenu_deprecated,
    commentaires.chantier_id,
    'PUBLIE'::STATUT_PUBLICATION AS statut
FROM {{ ref('stg_import_massif__commentaires') }} AS commentaires
LEFT OUTER JOIN {{ source('db_schema_public', 'utilisateur') }} AS utilisateur
    ON commentaires.auteur_email = utilisateur.email
LEFT OUTER JOIN
    {{ source('db_schema_public', 'utilisateur') }} AS utilisateur_import
    ON utilisateur_import.email = 'import.csv@modernisation.gouv.fr'
WHERE commentaires."type" IN (
    'notre_ambition',
    'deja_fait',
    'a_faire'
)
