SELECT
    {{ dbt_utils.surrogate_key(
                 ['chantier_id',
                 'type']
             ) }} as id, -- il faudra ajouter la maille et le code insee dans l'id de la table
    chantier_id,
    type,
    contenu,
    date,
    auteur
FROM {{ ref('stg_import_commentaires__commentaires') }}

