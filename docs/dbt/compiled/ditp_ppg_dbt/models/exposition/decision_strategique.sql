SELECT
    md5(cast(coalesce(cast(commentaires.chantier_id as TEXT), '') || '-' || coalesce(cast(commentaires.type as TEXT), '') || '-' || coalesce(cast(commentaires.date as TEXT), '') as TEXT)) AS id,
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
    commentaires."type"::TYPE_DECISION_STRATEGIQUE,
    commentaires.contenu,
    NULL::VARCHAR AS contenu_deprecated,
    commentaires.chantier_id,
    'PUBLIE'::STATUT_PUBLICATION AS statut
FROM "dev_pilote__6230"."raw_data"."stg_import_massif__commentaires" AS commentaires
LEFT OUTER JOIN "dev_pilote__6230"."public"."utilisateur" AS utilisateur
    ON commentaires.auteur_email = utilisateur.email
LEFT OUTER JOIN
    "dev_pilote__6230"."public"."utilisateur" AS utilisateur_import
    ON utilisateur_import.email = 'import.csv@modernisation.gouv.fr'
WHERE commentaires."type" = 'suivi_des_decisions'