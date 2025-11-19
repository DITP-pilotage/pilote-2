SELECT
    {{ dbt_utils.generate_surrogate_key(
                 ['chantier_id',
                 'type',
                 'date']
             ) }} as id,
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
FROM {{ ref('stg_import_massif__commentaires') }}
WHERE type='suivi_des_decisions'
