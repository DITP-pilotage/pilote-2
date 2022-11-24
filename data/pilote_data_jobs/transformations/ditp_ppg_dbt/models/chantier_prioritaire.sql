SELECT
    trigrammes_from_id_code as id,
    liste_des_chantiers_de_perseverance as nom,
    axe,
    ppg,
    ministere as porteur
FROM raw_data.ditp_liste_chantiers_perseverants_avec_trigramme