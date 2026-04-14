-- depends_on: "dev_pilote__6230"."public"."chantier_territoire"
SELECT
    md5(cast(coalesce(cast(chantier_id as TEXT), '') || '-' || coalesce(cast(maille as TEXT), '') || '-' || coalesce(cast(code_insee as TEXT), '') || '-' || coalesce(cast(date as TEXT), '') as TEXT)) AS id,
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
FROM "dev_pilote__6230"."raw_data"."stg_import_massif__commentaires"
WHERE type = 'synthese_des_resultats'