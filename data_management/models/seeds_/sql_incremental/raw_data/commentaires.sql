SELECT
    chantier_id,
    maille,
    code_insee,
    "date",
    "type",
    contenu,
    meteo,
    date_meteo,
    auteur_email
FROM {{ source('python_load_seeds', 'commentaires_py') }}
