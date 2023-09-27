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
VALUES 
    (
        'RESPONSABLE_REGION',
        'Responsable local régional',
        false,
        false,
        false,
        false,
        false
    ),
    (
        'RESPONSABLE_DEPARTEMENT',
        'Responsable local départemental',
        false,
        false,
        false,
        false,
        false
    ) ON CONFLICT (code) DO NOTHING;