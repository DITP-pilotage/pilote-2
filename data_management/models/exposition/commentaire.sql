-- depends_on: {{ ref('chantier_territoire') }}

SELECT
    {{
    dbt_utils.generate_surrogate_key(
        [
            'chantier_id',
             'type',
             'maille',
             'code_insee',
             'date'
        ]
    ) }} as id,
    chantier_id,
    type,
    contenu,
    NULL::VARCHAR as contenu_depracated,
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
    COALESCE(maille, 'NAT') as maille, --TODO supprimer le coalesce car la maille est sensé etre renseignée
    COALESCE(code_insee, 'FR') as code_insee, --TODO supprimer le coalesce car le code_insee est sensé etre renseigné
    CONCAT(maille, '-', code_insee) as territoire_code,
    'PUBLIE'::statut_publication as statut
FROM {{ ref('stg_import_massif__commentaires') }}
WHERE type='commentaires_sur_les_donnees'
    OR type='autres_resultats_obtenus'
    OR type='autres_resultats_obtenus_non_correles_aux_indicateurs'
    OR type='freins_a_lever'
    OR type='actions_a_venir'
    OR type='actions_a_valoriser'