-- Insert
INSERT INTO profil (
        code,
        nom,
        a_acces_tous_chantiers,
        a_acces_tous_chantiers_territorialises
    )
VALUES (
        'DITP_ADMIN',
        'DITP - Admin',
        true,
        true
    ),
    (
        'DITP_PILOTAGE',
        'DITP - Pilotage',
        true,
        true
    ),
    (
        'PR',
        'Présidence de la République',
        true,
        true
    ),
    (
        'PM_ET_CABINET',
        'Première Ministre et cabinet',
        true,
        true
    ),
    (
        'CABINET_MTFP',
        'Cabinet MTFP',
        true,
        true
    ),
    (
        'CABINET_MINISTERIEL',
        'Cabinets ministériels',
        false,
        false
    ),
    (
        'DIR_ADMIN_CENTRALE',
        'Direction d''administration centrale',
        false,
        false
    ),
    (
        'SECRETARIAT_GENERAL',
        'Secrétariat général de ministère (cormod)',
        false,
        false
    ),
    (
        'EQUIPE_DIR_PROJET',
        'Équipe de Directeur de projet',
        false,
        false
    ),
    (
        'DIR_PROJET',
        'Directeur de projet',
        false,
        false
    ),
    (
        'REFERENT_REGION',
        'Référent Pilote régional/SGAR',
        false,
        true
    ),
    (
        'PREFET_REGION',
        'Préfet de région et collaborateurs',
        false,
        true
    ),
    (
        'SERVICES_DECONCENTRES_REGION',
        'Services déconcentrés régionaux',
        false,
        false
    ),
    (
        'REFERENT_DEPARTEMENT',
        'Référent Pilote départemental',
        false,
        true
    ),
    (
        'PREFET_DEPARTEMENT',
        'Préfet de département et collaborateurs',
        false,
        true
    ),
    (
        'SERVICES_DECONCENTRES_DEPARTEMENT',
        'Services déconcentrés départementaux',
        false,
        false
    ),
    (
        'DROM',
        'DROM/Outre-Mer',
        false,
        true
    ),
    (
        'SANS_HABILITATIONS',
        'Sans Habilitations',
        false,
        false
    ) ON CONFLICT (code) DO NOTHING;