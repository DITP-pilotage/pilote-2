rm -rf input_data/private_data/PPG_metadata

docker-compose run pilote_scripts scripts/0_install_dbt_deps.sh
docker-compose run pilote_scripts scripts/0_prisma_migrate.sh
docker-compose run pilote_scripts scripts/2_fill_tables_ppg_metadata.sh
docker-compose run pilote_scripts scripts/3_fill_tables_import_massif_commentaires.sh
docker-compose run pilote_scripts scripts/4_fill_raw_data_mesures_indicateurs.sh
docker-compose run pilote_scripts scripts/5_fill_tables_staging.sh
docker-compose run pilote_scripts scripts/7_fill_tables_public.sh
