-- Insert
INSERT INTO profil_habilitation (profil_id, habilitation_scope_id)
VALUES (
        (
            SELECT id
            FROM profil
            WHERE code = 'DITP_ADMIN'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'DITP_ADMIN'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'saisie.commentaire'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'DITP_ADMIN'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'saisie.indicateur'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'DITP_PILOTAGE'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'PR'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'PM_ET_CABINET'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'CABINET_MINISTERIEL'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'DIR_ADMIN_CENTRALE'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'CABINET_MTFP'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'SECRETARIAT_GENERAL'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'SECRETARIAT_GENERAL'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'saisie.indicateur'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'EQUIPE_DIR_PROJET'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'EQUIPE_DIR_PROJET'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'saisie.commentaire.nationale'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'EQUIPE_DIR_PROJET'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'saisie.indicateur.nationale'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'DIR_PROJET'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'DIR_PROJET'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'saisie.commentaire.nationale'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'DIR_PROJET'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'saisie.indicateur.nationale'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'REFERENT_REGION'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture.régionale'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'REFERENT_REGION'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture.départementale'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'PREFET_REGION'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture.régionale'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'PREFET_REGION'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture.départementale'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'SERVICES_DECONCENTRES_REGION'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture.régionale'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'SERVICES_DECONCENTRES_REGION'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture.départementale'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'REFERENT_DEPARTEMENT'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture.départementale'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'PREFET_DEPARTEMENT'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture.départementale'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'SERVICES_DECONCENTRES_DEPARTEMENT'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture.départementale'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'DROM'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'lecture'
        )
    ),
    (
        (
            SELECT id
            FROM profil
            WHERE code = 'DROM'
        ),
        (
            SELECT id
            FROM habilitation_scope
            WHERE code = 'saisie.commentaire.nationale'
        )
    ) ON CONFLICT (profil_id, habilitation_scope_id) DO NOTHING;