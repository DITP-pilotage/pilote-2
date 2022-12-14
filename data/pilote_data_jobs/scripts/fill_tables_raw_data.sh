#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "No arguments supplied : running job on open_data"
    FOLDER="open_data"
else
    FOLDER=$1
fi

# Uniquement sur du local
if [ -z $DATABASE_URL ];
then
  if [ -f .env ];
  then
    export $(grep -v '^#' .env | xargs)
  else
    echo "ERROR : .env does not exist. Cannot load variable DATABASE_URL. Exiting"
    exit 1
  fi
fi

psql $DATABASE_URL -c "truncate table raw_data.metadata_chantier"
psql $DATABASE_URL -c "truncate table raw_data.metadata_perimetre"
psql $DATABASE_URL -c "truncate table raw_data.metadata_indicateur"
psql $DATABASE_URL -c "truncate table raw_data.metadata_zone"
psql $DATABASE_URL -c "truncate table raw_data.indicateur_type"
psql $DATABASE_URL -c "truncate table raw_data.fact_progress_indicateur"
psql $DATABASE_URL -c "truncate table raw_data.dim_tree_nodes"
psql $DATABASE_URL -c "truncate table raw_data.fact_progress_chantier"
psql $DATABASE_URL -c "truncate table raw_data.dim_structures"
psql $DATABASE_URL -c "truncate table raw_data.metadata_porteur"
psql $DATABASE_URL -c "truncate table raw_data.metadata_axe"
psql $DATABASE_URL -c "truncate table raw_data.metadata_ppg"



echo "Sleep for 15s"
sleep 15
# Import des données issues de PPG_metadata
# psql $DATABASE_URL -c "copy raw_data.metadata_chantier from STDIN with csv delimiter ',' header;" < input_data/$FOLDER/PPG_metadata/views/chantier/view_meta_chantier.csv
# script TEMPORAIRE de remplacement pour recharger les données chantier
psql $DATABASE_URL -c "create temporary table temporary_chantier (chantier_id text,ch_code text,ch_descr text,ch_nom text,ch_dp text,ch_ppg text,ch_perseverant text,porteur_shorts_nodac text,porteur_ids_nodac text,porteur_shorts_dac text,porteur_ids_dac text,ch_per text);
                       copy temporary_chantier (chantier_id,ch_code,ch_descr,ch_nom,ch_dp,ch_ppg,ch_perseverant,porteur_shorts_nodac,porteur_ids_nodac,porteur_shorts_dac,porteur_ids_dac,ch_per) from STDIN with csv delimiter ',' header;
                       insert into raw_data.metadata_chantier select chantier_id, ch_code, ch_descr, ch_nom, ch_ppg, ch_perseverant, porteur_shorts_nodac, porteur_ids_nodac, porteur_shorts_dac, porteur_ids_dac, ch_per, ch_dp from temporary_chantier;
                       drop table temporary_chantier;" < input_data/$FOLDER/PPG_metadata/views/chantier/view_meta_chantier.csv
psql $DATABASE_URL -c "copy raw_data.metadata_perimetre from STDIN with csv delimiter ',' header;" < input_data/$FOLDER/PPG_metadata/views/perimetre/view_meta_perimetre.csv
psql $DATABASE_URL -c "copy raw_data.metadata_indicateur from STDIN with csv delimiter ',' header;" < input_data/$FOLDER/PPG_metadata/views/indicateur/view_meta_indicateur.csv
psql $DATABASE_URL -c "copy raw_data.metadata_zone from STDIN with csv delimiter ',' header;" < input_data/$FOLDER/PPG_metadata/views/zone/view_meta_zone.csv
psql $DATABASE_URL -c "copy raw_data.indicateur_type from STDIN with csv delimiter ',' header;" < input_data/$FOLDER/PPG_metadata/models/indicateur/ref_indic_type.csv
psql $DATABASE_URL -c "copy raw_data.metadata_porteur from STDIN with csv delimiter ',' header;" < input_data/$FOLDER/PPG_metadata/views/porteur/view_meta_porteur.csv
psql $DATABASE_URL -c "copy raw_data.metadata_axe from STDIN with csv delimiter ',' header;" < input_data/$FOLDER/PPG_metadata/views/axe/view_meta_axe.csv
psql $DATABASE_URL -c "copy raw_data.metadata_ppg from STDIN with csv delimiter ',' header;" < input_data/$FOLDER/PPG_metadata/views/ppg/view_meta_ppg.csv

echo "Sleep for 30s"
sleep 30

# Import des données issues du dump dfakto
psql $DATABASE_URL -c "copy raw_data.fact_progress_indicateur from STDIN WITH (FORMAT csv, HEADER, DELIMITER ';', FORCE_NULL(valeur_initiale,valeur_actuelle,valeur_cible,progress,bounded_progress,date_valeur_initiale,date_valeur_actuelle,date_valeur_cible));" < input_data/$FOLDER/dump_dfakto_octo/rp/raw/fact_progress.csv
psql $DATABASE_URL -c "copy raw_data.dim_tree_nodes from STDIN WITH (FORMAT csv, HEADER, DELIMITER ';', FORCE_NULL(tree_node_last_synchronization_date,tree_node_last_update_scorecard_date,tree_node_last_scorecard_update_by_anybody_date,tree_node_last_update_children_date));" < input_data/$FOLDER/dump_dfakto_octo/rp/raw/dim_tree_nodes.csv
psql $DATABASE_URL -c "copy raw_data.fact_progress_chantier from STDIN WITH (FORMAT csv, HEADER, DELIMITER ';');" < input_data/$FOLDER/dump_dfakto_octo/rp/raw/fact_progress_reform.csv
psql $DATABASE_URL -c "copy raw_data.dim_structures from STDIN WITH (FORMAT csv, HEADER, DELIMITER ';');" < input_data/$FOLDER/dump_dfakto_octo/rp/raw/dim_structures.csv
