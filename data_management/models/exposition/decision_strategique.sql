SELECT
    {{ dbt_utils.surrogate_key(
                 ['chantier_id',
                 'type',
                 'date']
             ) }} as id,
    NULL::uuid as auteur_id,
    type::type_decision_strategique,
    contenu,
    date,
    chantier_id
FROM {{ ref('stg_import_massif__commentaires') }}
WHERE type='suivi_des_decisions'
