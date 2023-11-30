SELECT
    {{ dbt_utils.surrogate_key(
                 ['chantier_id',
                 'maille',
                 'code_insee',
                 'date']
             ) }} as id, --TODO date_meteo a ajouter lorsqu'elle sera présente dans l'import massif
    chantier_id,
    COALESCE(maille, 'NAT') as maille, --TODO supprimer le coalesce car la maille est sensé etre renseignée
    COALESCE(code_insee, 'FR') as code_insee, --TODO supprimer le coalesce car le code_insee est sensé etre renseigné
    auteur,
    COALESCE(meteo, 'NON_RENSEIGNEE') as meteo, --TODO meteo a ajouter dans le fichier d'import action @ditp
    date_meteo, --TODO date_meteo a ajouter dans le fichier d'import action @ditp
    contenu as commentaire,
    date as date_commentaire
FROM {{ ref('stg_import_massif__commentaires') }}
WHERE type='synthese_des_resultats'
