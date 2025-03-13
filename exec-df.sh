echo ">> Run dj prod"
cd data_management

FULL_DJ=false docker compose run --rm -e FULL_DJ pilote_datajobs
