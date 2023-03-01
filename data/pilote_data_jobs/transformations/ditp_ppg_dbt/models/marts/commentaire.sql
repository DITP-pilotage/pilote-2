SELECT
    id,
    type,
    contenu,
    date,
    auteur
FROM {{ ref('stg_import_commentaires__commentaires') }}
