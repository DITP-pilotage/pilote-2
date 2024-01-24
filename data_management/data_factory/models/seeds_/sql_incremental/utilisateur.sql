{{ config(schema = 'public') }}

select 
    "id"::uuid,
    "email","nom","prenom","profil_code","auteur_modification",
    "date_modification"::timestamp(3),
    "fonction" 
from {{ ref('utilisateur_py') }}
