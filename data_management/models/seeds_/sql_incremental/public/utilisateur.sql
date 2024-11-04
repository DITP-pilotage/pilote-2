select 
    "id"::uuid,
    "email","nom","prenom","profil_code",
    NULL::uuid as auteur_id_creation,
    NULL::uuid as auteur_id_modification,
    "date_modification"::timestamp(3),
    "date_creation"::timestamp(3),
    "fonction" 
from {{ source('python_load_seeds', 'utilisateur_py') }}
