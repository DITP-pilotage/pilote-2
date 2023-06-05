-- Insert
INSERT INTO scope (code, nom)
VALUES (
        'utilisateurs.lecture',
        'Visualiser les utilisateurs'
    ),
    (
        'utilisateurs.modification',
        'Modifier des utilisateurs'
    ),
    (
        'utilisateurs.suppression',
        'Supprimer des utilisateurs'
    ) ON CONFLICT (code) DO NOTHING;