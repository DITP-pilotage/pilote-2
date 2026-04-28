bash scripts/ddp_restore.sh
bash scripts/anonymisation_utilisateurs.sh
echo ">> Run dj prod"
cd ../pilote-ppg-data-management
FULL_DJ=false docker compose run --rm -e FULL_DJ pilote_datajobs
