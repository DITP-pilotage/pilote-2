select 
    "id"::uuid,
    "email",
    "nom",
    "prenom",
    "profil_code",
    NULL::uuid as auteur_id_creation,
    NULL::uuid as auteur_id_modification,
    "date_modification"::timestamp(3),
    "date_creation"::timestamp(3),
    "fonction",
    NULL::timestamp(3) as date_desactivation,
    NULL::timestamp(3) as date_visualisation_video_accueil,
    NULL::text as auteur_email_modification,
    NULL::text as auteur_email_creation,
    NULL::timestamp(3) as date_visualisation_popup_infolettre,
    NULL::timestamp(3) as date_inscription_infolettre
from {{ source('python_load_seeds', 'utilisateur_py') }}