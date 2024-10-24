-- depends_on: {{ ref('utilisateur') }}

select 
    "id"::uuid,
    "date_creation"::timestamptz,
    "utilisateur_email",
    "est_valide"::bool
from {{ source('python_load_seeds', 'rapport_import_mesure_indicateur_py') }}
