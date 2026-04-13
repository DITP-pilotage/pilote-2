-- depends_on: {{ ref('chantier_territoire') }}
SELECT
    {{ dbt_utils.generate_surrogate_key(
                 ['chantier_id',
                 'maille',
                 'code_insee',
                 'date']
             ) }} AS id,
    chantier_id,
    maille,
    code_insee,
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
    COALESCE(meteo, 'NON_RENSEIGNEE') AS meteo,
    date AS date_creation,
    date AS date_modification,
    contenu AS commentaire,
    NULL::VARCHAR AS commentaire_deprecated,
    CONCAT(maille, '-', code_insee) AS territoire_code,
    'PUBLIE'::STATUT_PUBLICATION AS statut
FROM {{ ref('stg_import_massif__commentaires') }}
WHERE type = 'synthese_des_resultats'
