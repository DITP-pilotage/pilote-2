select 
    "id"::uuid,
    "email","nom","prenom","profil_code","auteur_modification","auteur_creation",
    "date_modification"::timestamp(3),
    "date_creation"::timestamp(3),
    "fonction" 
from {{ source('python_load_seeds', 'utilisateur_py') }}
