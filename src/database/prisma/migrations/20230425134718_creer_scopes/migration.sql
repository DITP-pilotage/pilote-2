-- Insert
INSERT INTO scope (code, nom)
VALUES ('lecture', 'Lecture'),
    (
        'saisie.commentaire',
        'Saisie de commentaire'
    ),
    (
        'saisie.indicateur',
        'Saisie des indicateurs'
    ) ON CONFLICT (code) DO NOTHING;