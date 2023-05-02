with

source as (

    select * from {{ ref('ps_view_data_financials') }}

),

renamed as (

    select maille_territoriale_code as zone_code,
       projet_structurant_name as projet_structurant_nom,
       projet_structurant_code,
       objectif,
       synthese_des_resultats,
       difficultes_rencontrees_et_risques_anticipes,
       dernieres_realisation_et_suivi_des_decisions,
       solutions_proposees_et_prochaines_etapes,
       partenariats_et_moyens_mobilises,
       meteo,
       taux_avancement,
       methodologie_du_calcul_du_taux_d_avancement as methode_de_calcul,
       perimetre_ministeriel_1,
       perimetre_ministeriel_2,
       perimetre_ministeriel_3,
       perimetre_ministeriel_4,
       chefferie_de_projet,
       direction_de_l_administration_porteuse_du_projet,
       co_porteur_du_projet,
       objectif_date_de_mise_a_jour as objectif_date,
       synthese_des_resultats_date_de_mise_a_jour as synthese_des_resultats_date,
       difficultes_rencontrees_et_risques_anticipes_date_de_mise_a_jou as difficultes_rencontrees_et_risques_anticipes_date,
       dernieres_realisation_et_suivi_des_decisions_date_de_mise_a_jou as dernieres_realisation_et_suivi_des_decisions_date,
       solutions_proposees_et_prochaines_etapes_date_de_mise_a_jo as solutions_proposees_et_prochaines_etapes_date,
       partenariats_et_moyens_mobilises_date_de_mise_a_jour as partenariats_et_moyens_mobilises_date,
       meteo_date_de_mise_a_jour as meteo_date,
       taux_avancement_date_de_mise_a_jour,
       perimetre_ministeriel_1_date_de_mise_a_jour,
       perimetre_ministeriel_2_date_de_mise_a_jour,
       perimetre_ministeriel_3_date_de_mise_a_jour,
       perimetre_ministeriel_4_date_de_mise_a_jour,
       chefferie_de_projet_date_de_mise_a_jour,
       direction_administration_porteuse_date_de_mise_a_jour,
       co_porteur_du_projet_date_de_mise_a_jour

    from source

)

select *
    from renamed
    where zone_code <> '1'
