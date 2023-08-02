SELECT
    {{ dbt_utils.generate_surrogate_key(
                 ['chantier_id',
                 'type',
                 'date']
             ) }} as id,
    auteur,
    type::type_objectif,
    contenu,
    date,
    chantier_id
FROM {{ ref('stg_import_massif__commentaires') }}
WHERE type='notre_ambition'
    OR type='deja_fait'
    OR type='a_faire'