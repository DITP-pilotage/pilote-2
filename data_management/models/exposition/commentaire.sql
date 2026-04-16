-- depends_on: {{ ref('chantier_territoire') }}

SELECT
    {{
    dbt_utils.generate_surrogate_key(
        [
            'commentaires.chantier_id',
             'commentaires.type',
             'commentaires.maille',
             'commentaires.code_insee',
             'commentaires.date'
        ]
    ) }} AS id,
    commentaires.chantier_id,
    commentaires."type",
    commentaires.contenu,
    NULL::VARCHAR AS contenu_deprecated,
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
    --TODO supprimer le coalesce car la maille est sensé etre renseignée
    COALESCE(commentaires.maille, 'NAT') AS maille,
    --TODO supprimer le coalesce car le code_insee est sensé etre renseigné
    COALESCE(commentaires.code_insee, 'FR') AS code_insee,
    CONCAT(commentaires.maille, '-', code_insee) AS territoire_code,
    'PUBLIE'::STATUT_PUBLICATION AS statut
FROM {{ ref('stg_import_massif__commentaires') }} AS commentaires
LEFT OUTER JOIN {{ source('db_schema_public', 'utilisateur') }} AS utilisateur
    ON commentaires.auteur_email = utilisateur.email
LEFT OUTER JOIN
    {{ source('db_schema_public', 'utilisateur') }} AS utilisateur_import
    ON utilisateur_import.email = 'import.csv@modernisation.gouv.fr'
WHERE commentaires."type" IN (
    'commentaires_sur_les_donnees',
    'autres_resultats_obtenus',
    'autres_resultats_obtenus_non_correles_aux_indicateurs',
    'freins_a_lever',
    'actions_a_venir',
    'actions_a_valoriser'
)
