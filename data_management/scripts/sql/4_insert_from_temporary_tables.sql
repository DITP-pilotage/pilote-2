INSERT INTO commentaire	SELECT com.* FROM commentaire_tmp com  INNER JOIN chantier_territoire ct ON ct.id = com.chantier_id AND ct.territoire_code = com.territoire_code;
INSERT INTO synthese_des_resultats	SELECT * FROM synthese_des_resultats_tmp;
INSERT INTO decision_strategique	SELECT * FROM decision_strategique_tmp;
INSERT INTO objectif	SELECT * FROM objectif_tmp;