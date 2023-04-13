SELECT
    {{ dbt_utils.surrogate_key(
                 ['chantier_id',
                 'type',
                 'maille',
                 'code_insee']
             ) }} as id,
    chantier_id,
    type,
    contenu,
    date,
    auteur,
    COALESCE(maille, 'NAT') as maille, --TODO supprimer le coalesce car la maille est sensé etre renseignée
    COALESCE(code_insee, 'FR') as code_insee --TODO supprimer le coalesce car le code_insee est sensé etre renseigné
FROM {{ ref('stg_import_massif__commentaires') }}
