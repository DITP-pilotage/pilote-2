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
        false
    ),
    (
        'DITP_PILOTAGE',
        'DITP - Pilotage',
        true,
        false
    ),
    (
        'PM_ET_CABINET',
        'Première Ministre et cabinet',
        true,
        false
    ),
    (
        'PR',
        'Présidence de la République',
        true,
        false
    ),
    (
        'CABINET_MTFP',
        'Cabinet MTFP',
        true,
        false
    ),
    (
        'SANS_HABILITATIONS',
        'Sans Habilitations',
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
        'DIR_PROJET',
        'Directeur de projet',
        false,
        false
    ),
    (
        'MIOM',
        'MIOM/Outre-Mer',
        false,
        true
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
    ) ON CONFLICT (code) DO NOTHING;