select 
    "id"::uuid,
    "email","nom","prenom","profil_code",
    "auteur_modification" as auteur_email_modification,
    "auteur_creation" as auteur_email_creation,
    NULL::uuid as auteur_id_creation,
    NULL::uuid as auteur_id_modification,
    "date_modification"::timestamp(3),
    "date_creation"::timestamp(3),
    "fonction",
    NULL::timestamp(3) as date_desactivation
from {{ source('python_load_seeds', 'utilisateur_py') }}
