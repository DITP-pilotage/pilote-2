#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "No arguments supplied : running job on open_data"
    FOLDER="open_data"
else
    FOLDER=$1
fi

# Uniquement sur du local
if [ -z $DATABASE_URL ] || [ -z $PGHOST ] || [ -z $PGPORT ] || [ -z $PGUSER ] || [ -z $PGPASSWORD ] || [ -z $PGDATABASE ] || [ -z $DUMP_DFAKTO_RP_RAW ] || [ -z $DUMP_DFAKTO_RP_VIEWS_DATA ] || [ -z $PPG_METADATA_VIEWS ] || [ -z $PPG_METADATA_MODELS ];
then
  if [ -f .env ];
  then
    export $(grep -v '^#' .env | xargs)
  else
    echo "ERROR : .env does not exist. Cannot load variable DATABASE_URL. Exiting"
    exit 1
  fi
fi


dbt run --project-dir pilote_data_jobs/transformations/ditp_ppg_dbt/ --profiles-dir pilote_data_jobs/transformations/dbt_root/ --select raw staging

psql $DATABASE_URL -c "truncate table raw_data.view_data_properties"
psql $DATABASE_URL -c "truncate table raw_data.fact_financials_enr"
psql $DATABASE_URL -c "truncate table raw_data.dim_periods"

echo "Sleep for 15s"
sleep 15

# Import des données issues du dump dfakto
psql $DATABASE_URL -c "copy raw_data.view_data_properties from STDIN WITH (FORMAT csv, HEADER, DELIMITER ';', FORCE_NULL(meteo_date_de_mise_a_jour,chef_de_projet_national_date_de_mise_a_jour,objectifs_de_la_reforme_date_de_mise_a_jour,synthese_des_resultats_date_de_mise_a_jour,difficultes_rencontrees_et_risques_anticipes_date_de_mise,solutions_proposees_et_prochaines_etapes_date_de_mise_a_jo,un_exemple_concret_de_reussite_liee_a_la_reforme_date_de,dernieres_realisations_et_suivi_des_decisions_date_de_mise,methodologie_de_renseignement_de_la_meteo_date_de_mise_a,equipe_projet_donnee_qualitative_utilisateurs_date_de_mise,equipe_projet_donnee_qualitative_groupe_date_de_mise_a_jo,equipe_projet_donnee_quantitative_utilisateurs_date_de_mis,dac_date_de_mise_a_jour,acces_en_consultation_utilisateurs_date_de_mise_a_jour,contexte_local_date_de_mise_a_jour,feuille_de_route_date_de_mise_a_jour,referent_local_groupe_date_de_mise_a_jour));" < input_data/$FOLDER/dump_dfakto_octo/rp/views/data/rp_view_data_properties.csv
psql $DATABASE_URL -c "copy raw_data.fact_financials_enr from STDIN with csv delimiter ',' header;" < input_data/$FOLDER/dump_dfakto_octo/rp/raw/fact_financials_enr_short.csv
psql $DATABASE_URL -c "copy raw_data.dim_periods from STDIN WITH (FORMAT csv, HEADER, DELIMITER ';');" < input_data/$FOLDER/dump_dfakto_octo/rp/raw/dim_periods.csv
