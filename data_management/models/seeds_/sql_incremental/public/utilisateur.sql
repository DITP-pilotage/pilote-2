select 
    "id"::uuid,
    "email",
    "nom",
    "prenom",
    "profil_code",
    "auteur_id_creation"::uuid,
    "auteur_id_modification"::uuid,
    "date_modification"::timestamp(3),
    "date_creation"::timestamp(3),
    "fonction",
    NULL::timestamp(3) as date_desactivation
from {{ source('python_load_seeds', 'utilisateur_py') }}
