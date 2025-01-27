-- Restaurer les données à partir des tables temporaires

INSERT INTO commentaire	SELECT com.* FROM commentaire_tmp tmp  INNER JOIN chantier_territoire ct ON ct.id = tmp.chantier_id AND ct.territoire_code = tmp.territoire_code;
INSERT INTO synthese_des_resultats	SELECT * FROM synthese_des_resultats_tmp tmp INNER JOIN chantier_territoire ct ON ct.id = tmp.chantier_id AND ct.maille = LOWER(tmp.maille)::maille AND ct.code_insee = tmp.code_insee;
INSERT INTO decision_strategique	SELECT * FROM decision_strategique_tmp tmp INNER JOIN chantier_identite ci ON ci.id = tmp.chantier_id;
INSERT INTO objectif	SELECT * FROM objectif_tmp tmp INNER JOIN chantier_identite ci ON ci.id = tmp.chantier_id;
