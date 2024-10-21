UPDATE habilitation SET scope_code = 'saisieCommentaire' WHERE scope_code = 'saisie.commentaire'; -- suppr ?
UPDATE habilitation SET scope_code = 'saisieIndicateur' WHERE scope_code = 'saisie.indicateur'; -- suppr ?
UPDATE profil  -- suppr ?
SET a_acces_tous_les_territoires_saisie_commentaire = true -- suppr ?
WHERE code IN ('SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET'); -- suppr ?
