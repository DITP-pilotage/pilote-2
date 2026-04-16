-- depends_on: "dev_pilote__6230"."public"."chantier_territoire"
SELECT
    md5(cast(coalesce(cast(commentaires.chantier_id as TEXT), '') || '-' || coalesce(cast(commentaires.maille as TEXT), '') || '-' || coalesce(cast(commentaires.code_insee as TEXT), '') || '-' || coalesce(cast(commentaires.date as TEXT), '') as TEXT)) AS id,
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
FROM "dev_pilote__6230"."raw_data"."stg_import_massif__commentaires" AS commentaires
LEFT OUTER JOIN "dev_pilote__6230"."public"."utilisateur" AS utilisateur
    ON commentaires.auteur_email = utilisateur.email
LEFT OUTER JOIN
    "dev_pilote__6230"."public"."utilisateur" AS utilisateur_import
    ON utilisateur_import.email = 'import.csv@modernisation.gouv.fr'
WHERE commentaires."type" = 'synthese_des_resultats'