SELECT
    id::UUID,
    email,
    nom,
    prenom,
    profil_code,
    NULL::UUID AS auteur_id_creation,
    NULL::UUID AS auteur_id_modification,
    date_modification::TIMESTAMP(3),
    date_creation::TIMESTAMP(3),
    fonction,
    NULL::TIMESTAMP(3) AS date_desactivation,
    NULL::TIMESTAMP(3) AS date_visualisation_video_accueil,
    NULL::TEXT AS auteur_email_modification,
    NULL::TEXT AS auteur_email_creation,
    NULL::TIMESTAMP(3) AS date_visualisation_popup_infolettre,
    NULL::TIMESTAMP(3) AS date_inscription_infolettre
FROM {{ source('python_load_seeds', 'utilisateur_py') }}
