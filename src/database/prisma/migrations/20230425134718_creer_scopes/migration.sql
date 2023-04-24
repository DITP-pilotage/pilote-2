-- Insert
INSERT INTO habilitation_scope (code, nom)
VALUES ('lecture', 'Lecture'),
    (
        'lecture.nationale',
        'Lecture à la maille nationale'
    ),
    (
        'lecture.régionale',
        'Lecture à la maille régionale'
    ),
    (
        'lecture.départementale',
        'Lecture à la maille départementale'
    ),
    (
        'saisie.commentaire',
        'Saisie de commentaire'
    ),
    (
        'saisie.commentaire.nationale',
        'Saisie de commentaire à la maille nationale'
    ),
    (
        'saisie.commentaire.régionale',
        'Saisie de commentaire à la maille régionale'
    ),
    (
        'saisie.commentaire.départementale',
        'Saisie de commentaire à la maille départementale'
    ),
    (
        'saisie.indicateur',
        'Saisie des indicateurs'
    ),
    (
        'saisie.indicateur.nationale',
        'Saisie des indicateurs à la maille nationale'
    ),
    (
        'saisie.indicateur.régionale',
        'Saisie des indicateurs à la maille régionale'
    ),
    (
        'saisie.indicateur.départementale',
        'Saisie des indicateurs à la maille départementale'
    ) ON CONFLICT (code) DO NOTHING;