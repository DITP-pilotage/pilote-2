with

source as (

    select * from {{ ref('view_data_properties') }}

),

-- Renaming à faire
renamed as (

    select
        reforme_code,
        region_code,
        departement_code,
        academie_code,
        case
            when {{ dbt.split_part('reforme_code', "'-'", 1) }} = 'OVQ' then 'FRANCE'
            when region_code <> '' then {{ dbt.split_part('region_code', "'-'", 2) }}
            when academie_code <> '' then {{ dbt.split_part('academie_code', "'-'", 2) }}
            when departement_code <> '' then {{ dbt.split_part('departement_code', "'-'", 2) }}
            else NULL
        end as zone_code,
        case
            when {{ dbt.split_part('reforme_code', "'-'", 1) }} = 'OVQ' then {{ dbt.split_part('reforme_code', "'-'", 2) }}
            when region_code <> '' then {{ dbt.split_part('region_code', "'-'", 1) }}
            when academie_code <> '' then {{ dbt.split_part('academie_code', "'-'", 1) }}
            when departement_code <> '' then {{ dbt.split_part('departement_code', "'-'", 1) }}
            else NULL
        end as code_chantier,
        objectifs_de_la_reforme,
        synthese_des_resultats,
        difficultes_rencontrees_et_risques_anticipes,
        solutions_proposees_et_prochaines_etapes,
        un_exemple_concret_de_reussite_liee_a_la_reforme,
        dernieres_realisations_et_suivi_des_decisions,
        meteo as meteo_nom,
        meteo_date_de_mise_a_jour,
        methodologie_de_renseignement_de_la_meteo,
        chef_de_projet_national,
        chef_de_projet_national_date_de_mise_a_jour,
        equipe_projet_donnee_qualitative_utilisateurs,
        equipe_projet_donnee_qualitative_groupe,
        equipe_projet_donnee_quantitative_utilisateurs,
        dac,
        acces_en_consultation_utilisateurs,
        contexte_local,
        feuille_de_route,
        referent_local_groupe,
        reforme_name,
        objectifs_de_la_reforme_date_de_mise_a_jour,
        synthese_des_resultats_date_de_mise_a_jour,
        difficultes_rencontrees_et_risques_anticipes_date_de_mise,
        solutions_proposees_et_prochaines_etapes_date_de_mise_a_jo,
        un_exemple_concret_de_reussite_liee_a_la_reforme_date_de,
        dernieres_realisations_et_suivi_des_decisions_date_de_mise,
        methodologie_de_renseignement_de_la_meteo_date_de_mise_a,
        equipe_projet_donnee_qualitative_utilisateurs_date_de_mise,
        equipe_projet_donnee_qualitative_groupe_date_de_mise_a_jo,
        equipe_projet_donnee_quantitative_utilisateurs_date_de_mis,
        dac_date_de_mise_a_jour,
        acces_en_consultation_utilisateurs_date_de_mise_a_jour,
        contexte_local_date_de_mise_a_jour,
        feuille_de_route_date_de_mise_a_jour,
        referent_local_groupe_date_de_mise_a_jour

    from source

)

select * from renamed