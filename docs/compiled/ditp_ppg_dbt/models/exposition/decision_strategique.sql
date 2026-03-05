SELECT
    md5(cast(coalesce(cast(chantier_id as TEXT), '') || '-' || coalesce(cast(type as TEXT), '') || '-' || coalesce(cast(date as TEXT), '') as TEXT)) as id,
    (
        CASE 
            WHEN (SELECT id FROM utilisateur WHERE email = auteur_email) IS NOT NULL THEN 
                (SELECT id FROM utilisateur WHERE email = auteur_email)
            ELSE 
                (SELECT id FROM utilisateur WHERE email = 'import.csv@modernisation.gouv.fr')
        END
    )::uuid as auteur_id,
    auteur,
    type::type_decision_strategique,
    contenu,
    date,
    chantier_id
FROM "dev_pilote__6230"."raw_data"."stg_import_massif__commentaires"
WHERE type='suivi_des_decisions'