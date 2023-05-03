-- Insert
INSERT INTO profil (
        code,
        nom,
        a_acces_tous_chantiers,
        a_acces_tous_chantiers_territorialises,
        a_acces_tous_les_territoires_lecture,
        a_acces_tous_les_territoires_saisie_commentaire,
        a_acces_tous_les_territoires_saisie_indicateur
    )
VALUES (
        'DITP_ADMIN',
        'DITP - Admin',
        true,
        true,
        true,
        true,
        true
    ),
    (
        'DITP_PILOTAGE',
        'DITP - Pilotage',
        true,
        true,
        true,
        false,
        false
    ),
    (
        'PR',
        'Présidence de la République',
        true,
        true,
        true,
        false,
        false
    ),
    (
        'PM_ET_CABINET',
        'Première Ministre et cabinet',
        true,
        true,
        true,
        false,
        false
    ),
    (
        'CABINET_MTFP',
        'Cabinet MTFP',
        true,
        true,
        true,
        false,
        false
    ),
    (
        'CABINET_MINISTERIEL',
        'Cabinets ministériels',
        false,
        false,
        true,
        false,
        false
    ),
    (
        'DIR_ADMIN_CENTRALE',
        'Direction d''administration centrale',
        false,
        false,
        true,
        false,
        false
    ),
    (
        'SECRETARIAT_GENERAL',
        'Secrétariat général de ministère (cormod)',
        false,
        false,
        true,
        false,
        true
    ),
    (
        'EQUIPE_DIR_PROJET',
        'Équipe de Directeur de projet',
        false,
        false,
        true,
        false,
        true
    ),
    (
        'DIR_PROJET',
        'Directeur de projet',
        false,
        false,
        true,
        false,
        true
    ),
    (
        'REFERENT_REGION',
        'Référent Pilote régional/SGAR',
        false,
        true,
        false,
        false,
        false
    ),
    (
        'PREFET_REGION',
        'Préfet de région et collaborateurs',
        false,
        true,
        false,
        false,
        false
    ),
    (
        'SERVICES_DECONCENTRES_REGION',
        'Services déconcentrés régionaux',
        false,
        false,
        false,
        false,
        false
    ),
    (
        'REFERENT_DEPARTEMENT',
        'Référent Pilote départemental',
        false,
        true,
        false,
        false,
        false
    ),
    (
        'PREFET_DEPARTEMENT',
        'Préfet de département et collaborateurs',
        false,
        true,
        false,
        false,
        false
    ),
    (
        'SERVICES_DECONCENTRES_DEPARTEMENT',
        'Services déconcentrés départementaux',
        false,
        false,
        false,
        false,
        false
    ),
    (
        'DROM',
        'DROM/Outre-Mer',
        false,
        true,
        true,
        false,
        true
    ),
    (
        'SANS_HABILITATIONS',
        'Sans Habilitations',
        false,
        false,
        false,
        false,
        false
    ) ON CONFLICT (code) DO NOTHING;