{{ config(schema = 'public') }}

select 
    "id"::uuid,
    "email","nom","prenom","profil_code","auteur_modification","auteur_creation",
    "date_modification"::timestamp(3),
    "date_creation"::timestamp(3),
    "fonction" 
from {{ source('dlt_load_tmp', 'utilisateur_py') }}
