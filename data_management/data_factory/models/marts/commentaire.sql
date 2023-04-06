SELECT
    floor(random() * 1000000000 + 1)::int as id, -- TODO remettre une surrogate key
    chantier_id,
    type,
    contenu,
    date,
    auteur,
    COALESCE(maille, 'NAT') as maille, --TODO supprimer le coalesce car la maille est sensé etre renseignée
    COALESCE(code_insee, 'FR') as code_insee --TODO supprimer le coalesce car le code_insee est sensé etre renseigné
FROM {{ ref('stg_import_commentaires__commentaires') }}

