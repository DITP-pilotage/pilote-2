-- Backfill auteur_creation_id et auteur_modification_id pour les enregistrements
UPDATE commentaire SET auteur_creation_id = '5a22b612-9f26-498e-9644-29d35ef8348d' WHERE auteur_creation_id IS NULL;
UPDATE commentaire SET auteur_modification_id = '5a22b612-9f26-498e-9644-29d35ef8348d' WHERE auteur_modification_id IS NULL;

UPDATE synthese_des_resultats SET auteur_creation_id = '5a22b612-9f26-498e-9644-29d35ef8348d' WHERE auteur_creation_id IS NULL;
UPDATE synthese_des_resultats SET auteur_modification_id = '5a22b612-9f26-498e-9644-29d35ef8348d' WHERE auteur_modification_id IS NULL;

UPDATE decision_strategique SET auteur_creation_id = '5a22b612-9f26-498e-9644-29d35ef8348d' WHERE auteur_creation_id IS NULL;
UPDATE decision_strategique SET auteur_modification_id = '5a22b612-9f26-498e-9644-29d35ef8348d' WHERE auteur_modification_id IS NULL;

UPDATE objectif SET auteur_creation_id = '5a22b612-9f26-498e-9644-29d35ef8348d' WHERE auteur_creation_id IS NULL;
UPDATE objectif SET auteur_modification_id = '5a22b612-9f26-498e-9644-29d35ef8348d' WHERE auteur_modification_id IS NULL;