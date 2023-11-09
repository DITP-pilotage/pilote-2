UPDATE scope SET code = 'saisieCommentaire' WHERE code = 'saisie.commentaire';
UPDATE scope SET code = 'saisieIndicateur' WHERE code = 'saisie.indicateur';
UPDATE habilitation SET scope_code = 'saisieCommentaire' WHERE scope_code = 'saisie.commentaire';
UPDATE habilitation SET scope_code = 'saisieIndicateur' WHERE scope_code = 'saisie.indicateur';
UPDATE profil 
SET a_acces_tous_les_territoires_saisie_commentaire = true
WHERE code IN ('SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET');