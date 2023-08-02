SELECT
    {{ dbt_utils.surrogate_key(
                 ['chantier_id',
                 'type',
                 'maille',
                 'code_insee',
                 'date']
             ) }} as id,
    chantier_id,
    type,
    contenu,
    date,
    auteur,
    COALESCE(maille, 'NAT') as maille, --TODO supprimer le coalesce car la maille est sensé etre renseignée
    COALESCE(code_insee, 'FR') as code_insee --TODO supprimer le coalesce car le code_insee est sensé etre renseigné
FROM {{ ref('stg_import_massif__commentaires') }}
WHERE type='commentaires_sur_les_donnees'
    OR type='autres_resultats_obtenus'
    OR type='autres_resultats_obtenus_non_correles_aux_indicateurs'
    OR type='freins_a_lever'
    OR type='actions_a_venir'
    OR type='actions_a_valoriser'
