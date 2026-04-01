SELECT
    {{ dbt_utils.generate_surrogate_key(
                 ['chantier_id',
                 'type',
                 'date']
             ) }} as id,
    date as date_creation,
    (
        CASE 
            WHEN (SELECT id FROM utilisateur WHERE email = auteur_email) IS NOT NULL THEN 
                (SELECT id FROM utilisateur WHERE email = auteur_email)
            ELSE 
                (SELECT id FROM utilisateur WHERE email = 'import.csv@modernisation.gouv.fr')
        END
    )::uuid as auteur_creation_id,
    date as date_modification,
    (
        CASE 
            WHEN (SELECT id FROM utilisateur WHERE email = auteur_email) IS NOT NULL THEN 
                (SELECT id FROM utilisateur WHERE email = auteur_email)
            ELSE 
                (SELECT id FROM utilisateur WHERE email = 'import.csv@modernisation.gouv.fr')
        END
    )::uuid as auteur_modification_id,
    type::type_decision_strategique,
    contenu,
    NULL::VARCHAR as contenu_depracated,
    chantier_id,
    'PUBLIE'::statut_publication as statut
FROM {{ ref('stg_import_massif__commentaires') }}
WHERE type='suivi_des_decisions'