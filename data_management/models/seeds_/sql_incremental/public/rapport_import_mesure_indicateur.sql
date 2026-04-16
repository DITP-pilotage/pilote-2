-- depends_on: {{ ref('utilisateur') }}

SELECT
    id::UUID,
    date_creation::TIMESTAMPTZ,
    utilisateur_email,
    est_valide::BOOL
FROM {{ source('python_load_seeds', 'rapport_import_mesure_indicateur_py') }}
