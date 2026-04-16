-- depends_on: {{ ref('chantier_territoire') }}
SELECT
    {{ dbt_utils.generate_surrogate_key(
                 ['commentaires.chantier_id',
                 'commentaires.maille',
                 'commentaires.code_insee',
                 'commentaires.date']
             ) }} AS id,
    commentaires.chantier_id,
    commentaires.maille,
    commentaires.code_insee,
    COALESCE(
        utilisateur.id,
        utilisateur_import.id
    )::UUID AS auteur_creation_id,
    COALESCE(
        utilisateur.id,
        utilisateur_import.id
    )::UUID AS auteur_modification_id,
    COALESCE(commentaires.meteo, 'NON_RENSEIGNEE') AS meteo,
    commentaires."date" AS date_creation,
    commentaires."date" AS date_modification,
    commentaires.contenu AS commentaire,
    NULL::VARCHAR AS commentaire_deprecated,
    commentaires.maille || '-' || commentaires.code_insee AS territoire_code,
    'PUBLIE'::STATUT_PUBLICATION AS statut
FROM {{ ref('stg_import_massif__commentaires') }} AS commentaires
LEFT OUTER JOIN {{ source('db_schema_public', 'utilisateur') }} AS utilisateur
    ON commentaires.auteur_email = utilisateur.email
LEFT OUTER JOIN
    {{ source('db_schema_public', 'utilisateur') }} AS utilisateur_import
    ON utilisateur_import.email = 'import.csv@modernisation.gouv.fr'
WHERE commentaires."type" = 'synthese_des_resultats'
