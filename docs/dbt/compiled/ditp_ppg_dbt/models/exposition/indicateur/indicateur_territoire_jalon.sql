-- depends_on: "dev_pilote__6230"."public"."indicateur_territoire"



SELECT
    tous_jalons.indic_id AS id,
    territoire.code AS territoire_code,
    territoire.code_insee,
    territoire.maille,
    jalons.jalon,
    territoire.zone_id,
    tous_jalons.vca_date AS date_valeur_cible,
    tous_jalons.taa AS taux_avancement,
    tous_jalons.vca AS valeur_cible,
    tous_jalons.taa_proposition AS taux_avancement_proposition,
    tous_jalons.date_vaca AS date_valeur_actuelle,
    tous_jalons.vaca AS valeur_actuelle
FROM "dev_pilote__6230"."df3"."compute_ta_indic_jalon" AS tous_jalons
INNER JOIN "dev_pilote__6230"."public"."territoire" AS territoire
    ON tous_jalons.zone_id = territoire.zone_id
RIGHT JOIN
    "dev_pilote__6230"."df3"."jalons_a_etudier" AS jalons
    ON tous_jalons.jalon = jalons.jalon
ORDER BY id, territoire_code, jalons.jalon