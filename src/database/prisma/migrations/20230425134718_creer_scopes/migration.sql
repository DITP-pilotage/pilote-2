-- Insert
INSERT INTO scope (code, nom)
VALUES ('lecture', 'Lecture'),
    (
        'saisieCommentaire',
        'Saisie de commentaire'
    ),
    (
        'saisieIndicateur',
        'Saisie des indicateurs'
    ) ON CONFLICT (code) DO NOTHING;