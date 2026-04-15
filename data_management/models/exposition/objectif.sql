SELECT
    {{ dbt_utils.generate_surrogate_key(
                 ['chantier_id',
                 'type',
                 'date']
             ) }} AS id,
    date AS date_creation,
    (
        CASE
            WHEN
                (
                    SELECT id FROM utilisateur
                    WHERE email = auteur_email
                ) IS NOT NULL
                THEN
                    (
                        SELECT id FROM utilisateur
                        WHERE email = auteur_email
                    )
            ELSE
                (
                    SELECT id FROM utilisateur
                    WHERE email = 'import.csv@modernisation.gouv.fr'
                )
        END
    )::UUID AS auteur_creation_id,
    date AS date_modification,
    (
        CASE
            WHEN
                (
                    SELECT id FROM utilisateur
                    WHERE email = auteur_email
                ) IS NOT NULL
                THEN
                    (
                        SELECT id FROM utilisateur
                        WHERE email = auteur_email
                    )
            ELSE
                (
                    SELECT id FROM utilisateur
                    WHERE email = 'import.csv@modernisation.gouv.fr'
                )
        END
    )::UUID AS auteur_modification_id,
    type::TYPE_OBJECTIF,
    contenu,
    NULL::VARCHAR AS contenu_deprecated,
    chantier_id,
    'PUBLIE'::STATUT_PUBLICATION AS statut
FROM {{ ref('stg_import_massif__commentaires') }}
WHERE
    type = 'notre_ambition'
    OR type = 'deja_fait'
    OR type = 'a_faire'
