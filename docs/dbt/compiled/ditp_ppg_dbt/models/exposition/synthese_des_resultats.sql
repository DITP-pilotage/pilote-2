-- depends_on: "dev_pilote__6230"."public"."chantier_territoire"
SELECT
    md5(cast(coalesce(cast(chantier_id as TEXT), '') || '-' || coalesce(cast(maille as TEXT), '') || '-' || coalesce(cast(code_insee as TEXT), '') || '-' || coalesce(cast(date as TEXT), '') as TEXT)) as id, --TODO date_meteo a ajouter lorsqu'elle sera présente dans l'import massif
    chantier_id,
    COALESCE(maille, 'NAT') as maille, --TODO supprimer le coalesce car la maille est sensé etre renseignée
    COALESCE(code_insee, 'FR') as code_insee, --TODO supprimer le coalesce car le code_insee est sensé etre renseigné
    (
        CASE 
            WHEN (SELECT id FROM utilisateur WHERE email = auteur_email) IS NOT NULL THEN 
                (SELECT id FROM utilisateur WHERE email = auteur_email)
            ELSE 
                (SELECT id FROM utilisateur WHERE email = 'import.csv@modernisation.gouv.fr')
        END
    )::uuid as auteur_creation_id,
    (
        CASE 
            WHEN (SELECT id FROM utilisateur WHERE email = auteur_email) IS NOT NULL THEN 
                (SELECT id FROM utilisateur WHERE email = auteur_email)
            ELSE 
                (SELECT id FROM utilisateur WHERE email = 'import.csv@modernisation.gouv.fr')
        END
    )::uuid as auteur_modification_id,
    COALESCE(meteo, 'NON_RENSEIGNEE') as meteo,
    date as date_creation,
    date as date_modification,
    contenu as commentaire,
    NULL::VARCHAR as commentaire_deprecated,
    CONCAT(maille, '-', code_insee) as territoire_code,
    'PUBLIE'::statut_publication as statut
FROM "dev_pilote__6230"."raw_data"."stg_import_massif__commentaires"
WHERE type='synthese_des_resultats'