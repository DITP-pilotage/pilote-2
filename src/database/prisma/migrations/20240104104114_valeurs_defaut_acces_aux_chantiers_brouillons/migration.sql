UPDATE profil 
SET a_access_aux_chantiers_brouillons = true
WHERE code IN ('EQUIPE_DIR_PROJET', 'DIR_PROJET', 'DITP_ADMIN', 'DITP_PILOTAGE');
